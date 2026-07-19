import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:async';
import '../../config/app_config.dart';
import '../../models/coach_model.dart';
import '../../models/scene_model.dart';
import '../../models/training_model.dart';
import '../../network/services/training_service.dart';
import '../../network/services/auth_service.dart';

class TrainingPage extends StatefulWidget {
  final CoachModel coach;
  final SceneModel scene;

  const TrainingPage({super.key, required this.coach, required this.scene});

  @override
  State<TrainingPage> createState() => _TrainingPageState();
}

class _TrainingPageState extends State<TrainingPage> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _trainingService = TrainingService();

  IO.Socket? _socket;
  List<_UIMessage> _messages = [];
  bool _isLoading = false;
  bool _isSending = false;
  bool _isSceneIntro = false;
  int _introSeconds = 15;
  Timer? _introTimer;
  String? _sessionId;
  int _currentRound = 0;
  int _maxRounds = 20;
  int _currentScore = 50;
  int _scoreDelta = 0;
  int _topicsCovered = 0;
  int _totalTopics = 5;
  List<String> _referenceOptions = [];
  List<_Suggestion> _currentSuggestions = [];
  bool _showSuggestions = false;
  String? _npcPersonality;

  @override
  void initState() {
    super.initState();
    _connectSocket();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _introTimer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  void _startSceneIntro() {
    setState(() {
      _isSceneIntro = true;
      _introSeconds = 15;
    });
    _introTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _introSeconds--;
      });
      if (_introSeconds <= 0) {
        timer.cancel();
        _startTraining();
      }
    });
  }

  void _connectSocket() {
    _socket = IO.io(
        'http://${AppConfig.apiBaseUrl.replaceFirst('https://', '').replaceFirst('http://', '')}',
        <String, dynamic>{
          'transports': ['websocket'],
          'autoConnect': false,
        });

    _socket?.onConnect(() async {
      final token = await AuthService.getToken();
      _socket?.emit('authenticate', token);
    });

    _socket?.on('authenticated', (data) {
      if (data['success'] == true) {
        _startSceneIntro();
      }
    });

    _socket?.on('training_started', (data) {
      setState(() {
        _sessionId = data['session_id'];
        _currentScore = data['current_score'] ?? 50;
        _currentRound = data['round'] ?? 0;
        _maxRounds = data['max_rounds'] ?? 20;
        _npcPersonality = data['personality'];
        _referenceOptions = _generateReferenceOptions();
      });
      _addMessage(_UIMessage(
        role: 'assistant',
        content: data['opening_line'],
        emotion: 'neutral',
        personality: _npcPersonality,
      ));
    });

    _socket?.on('npc_message', (data) {
      _addMessage(_UIMessage(
        role: 'assistant',
        content: data['content'],
        emotion: data['emotion'],
      ));
      setState(() {
        _referenceOptions = _generateReferenceOptions();
      });
    });

    _socket?.on('suggestions', (data) {
      final items = List<Map<String, dynamic>>.from(data['items'] ?? []);
      setState(() {
        _currentSuggestions = items
            .map((item) => _Suggestion(
                  type: item['type'],
                  content: item['content'],
                ))
            .toList();
        _showSuggestions = _currentSuggestions.isNotEmpty;
      });
      Future.delayed(const Duration(seconds: 8), () {
        setState(() => _showSuggestions = false);
      });
    });

    _socket?.on('score_update', (data) {
      setState(() {
        _currentScore = data['current_score'] ?? _currentScore;
        _scoreDelta = data['score_delta'] ?? 0;
        _currentRound = data['round'] ?? _currentRound;
        _topicsCovered = data['topics_covered'] ?? _topicsCovered;
        _totalTopics = data['total_topics'] ?? _totalTopics;
      });
    });

    _socket?.on('training_complete', (data) {
      _handleTrainingComplete(data);
    });

    _socket?.on('time_travel', (data) {
      setState(() {
        _currentRound = data['round'] ?? _currentRound;
      });
    });

    _socket?.on('error', (data) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(data['message'] ?? '未知错误')));
    });

    _socket?.connect();
  }

  Future<void> _startTraining() async {
    setState(() => _isLoading = true);
    try {
      _socket?.emit('start_training', {
        'scene_id': widget.scene.id,
      });
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('启动训练失败: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty || _isSending) return;

    _addMessage(_UIMessage(role: 'user', content: text.trim()));
    _messageController.clear();
    setState(() {
      _isSending = true;
      _showSuggestions = false;
    });

    _socket?.emit('user_message', {
      'content': text.trim(),
      'use_hint': false,
      'use_time_travel': false,
    });

    setState(() => _isSending = false);
    _scrollToBottom();
  }

  void _useReferenceOption(String option) {
    _messageController.text = option;
    setState(() => _referenceOptions = []);
  }

  void _addMessage(_UIMessage msg) {
    setState(() => _messages.add(msg));
    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleTrainingComplete(Map<String, dynamic> data) {
    Navigator.of(context).pushReplacementNamed('/training-result', arguments: {
      'scene_name': widget.scene.name,
      'final_score': data['final_score'],
      'rounds': data['rounds'],
      'topics_covered': data['topics_covered'],
      'completion_reason': _getCompletionReasonText(data['reason']),
      'points_gained': data['points_gained'],
    });
  }

  String _getCompletionReasonText(String? reason) {
    switch (reason) {
      case 'perfect':
        return '满分结束';
      case 'zero':
        return '累计得分降至-100分';
      case 'complete':
        return '话题覆盖完成';
      case 'max_rounds':
        return '达到最大轮数';
      case 'manual':
        return '用户主动结束';
      case 'forced':
        return '连续3轮负分强制结束';
      default:
        return '未知原因';
    }
  }

  void _confirmEndTraining() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('结束训练'),
        content: const Text('确定要提前结束本次训练吗？'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('继续训练')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _socket?.emit('end_training');
            },
            child: const Text('确定结束', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  List<String> _generateReferenceOptions() {
    switch (widget.scene.name) {
      case '相亲模拟':
        return [
          '我在互联网公司做产品经理，主要做用户增长',
          '我是做设计的，平时比较忙，但挺喜欢现在的工作',
          '我工作比较普通，就是坐办公室的',
        ];
      case '模拟面试':
        return [
          '我有3年相关工作经验，负责过多个核心项目',
          '我对这个岗位很感兴趣，一直在学习相关技能',
          '我最大的优势是快速学习能力和团队协作精神',
        ];
      case '加薪谈判':
        return [
          '这一年我为公司带来了显著的业绩增长',
          '我的能力已经超出了当前岗位的要求',
          '希望能根据市场行情调整薪资',
        ];
      case '兴趣社群自我介绍':
        return [
          '大家好！我是新来的，很喜欢摄影',
          '我想学习更多摄影技巧，希望大家多多指教',
          '我平时喜欢拍风景和人像，很高兴加入这个社群',
        ];
      case '被朋友误解(NVC)':
        return [
          '对不起，让你担心了，我不是故意不回消息的',
          '我理解你的感受，当时确实是有急事',
          '我以后会注意及时回复你的消息',
        ];
      case '共情沟通训练':
        return [
          '我理解你的感受，确实不容易...',
          '谢谢你愿意和我分享，我会一直支持你',
          '听起来你压力很大，需要我帮你分析一下吗？',
        ];
      default:
        return ['我明白了', '继续说说吧', '听起来不错'];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.scene.name),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        leading: _isSceneIntro
            ? null
            : IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _confirmEndTraining,
              ),
        actions: _isSceneIntro
            ? []
            : [
                if (_npcPersonality != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(_npcPersonality!,
                        style: const TextStyle(fontSize: 12)),
                  ),
                IconButton(
                  icon: const Icon(Icons.stop_circle_outlined),
                  onPressed: _confirmEndTraining,
                  tooltip: '结束训练',
                ),
              ],
      ),
      body: _isSceneIntro
          ? _buildSceneIntro()
          : _isLoading
              ? const Center(
                  child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('正在进入训练场景...', style: TextStyle(color: Colors.grey)),
                  ],
                ))
              : Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      color: Colors.grey[50],
                      child: Row(
                        children: [
                          Icon(Icons.psychology,
                              size: 16, color: AppConfig.primaryColor),
                          const SizedBox(width: 4),
                          Text(widget.coach.displayName,
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w500)),
                          const Spacer(),
                          Text(
                            '进度 ${_topicsCovered}/${_totalTopics}',
                            style: TextStyle(
                                fontSize: 12, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) =>
                            _buildMessageBubble(_messages[index]),
                      ),
                    ),
                    if (_referenceOptions.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          border:
                              Border(top: BorderSide(color: Colors.grey[200])),
                        ),
                        child: Column(
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  Icon(Icons.lightbulb_outline,
                                      size: 14, color: Colors.amber),
                                  SizedBox(width: 4),
                                  Text('参考选项（点击使用）',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[600])),
                                ],
                              ),
                            ),
                            ..._referenceOptions
                                .asMap()
                                .entries
                                .map((e) => Padding(
                                      padding: const EdgeInsets.only(bottom: 6),
                                      child: InkWell(
                                        onTap: () =>
                                            _useReferenceOption(e.value),
                                        child: Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 12, vertical: 10),
                                          decoration: BoxDecoration(
                                            border: Border.all(
                                                color: AppConfig.primaryColor
                                                    .withOpacity(0.3)),
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            color: Colors.grey[50],
                                          ),
                                          child: Text(
                                            '${[
                                              'A',
                                              'B',
                                              'C'
                                            ][e.key]}. ${e.value}',
                                            style: TextStyle(
                                                fontSize: 13,
                                                color: Colors.grey[700]),
                                          ),
                                        ),
                                      ),
                                    ))
                                .toList(),
                          ],
                        ),
                      ),
                    if (_showSuggestions && _currentSuggestions.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          border:
                              Border(top: BorderSide(color: Colors.blue[200])),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: _currentSuggestions
                              .map((s) => Padding(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 4),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Icon(
                                          s.type.contains('加分')
                                              ? Icons.check_circle
                                              : Icons.info_outline,
                                          size: 14,
                                          color: s.type.contains('加分')
                                              ? Colors.green
                                              : Colors.blue,
                                        ),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            s.content,
                                            style: TextStyle(
                                                fontSize: 13,
                                                color: Colors.grey[700]),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ))
                              .toList(),
                        ),
                      ),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                              color: Colors.grey.withOpacity(0.2),
                              blurRadius: 4)
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '得分：$_currentScore分',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: _currentScore >= 60
                                      ? Colors.green
                                      : Colors.red,
                                ),
                              ),
                              const SizedBox(width: 16),
                              if (_scoreDelta != 0)
                                Text(
                                  _scoreDelta > 0
                                      ? '本轮+$_scoreDelta分'
                                      : '本轮$_scoreDelta分',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: _scoreDelta > 0
                                        ? Colors.green
                                        : Colors.red,
                                  ),
                                ),
                              const SizedBox(width: 16),
                              Text(
                                '累计$_currentRound轮',
                                style: TextStyle(
                                    fontSize: 13, color: Colors.grey[600]),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _messageController,
                                  enabled: !_isSending,
                                  decoration: const InputDecoration(
                                    hintText: '输入你的回答...',
                                    border: OutlineInputBorder(),
                                    contentPadding: EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 10),
                                  ),
                                  onSubmitted: _sendMessage,
                                  maxLines: 3,
                                  minLines: 1,
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                icon: _isSending
                                    ? const SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2))
                                    : Icon(Icons.send,
                                        color: AppConfig.primaryColor,
                                        size: 24),
                                onPressed: _isSending
                                    ? null
                                    : () =>
                                        _sendMessage(_messageController.text),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildSceneIntro() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppConfig.primaryColor.withOpacity(0.1),
              ),
              child:
                  Icon(Icons.scenario, size: 60, color: AppConfig.primaryColor),
            ),
            const SizedBox(height: 30),
            Text(
              widget.scene.name,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(
              widget.scene.description ?? '社交训练场景',
              style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                  textAlign: TextAlign.center),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: AppConfig.accentColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(30),
              ),
              child: Text(
                '准备时间：$_introSeconds秒',
                style: TextStyle(
                    fontSize: 18,
                    color: AppConfig.accentColor,
                    fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                _introTimer?.cancel();
                _startTraining();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConfig.primaryColor,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('跳过介绍，开始训练', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(_UIMessage msg) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 18,
              backgroundColor: AppConfig.primaryColor.withOpacity(0.1),
              child:
                  Icon(Icons.person, size: 20, color: AppConfig.primaryColor),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? AppConfig.primaryColor : Colors.grey[100],
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
              ),
              child: Column(
                crossAxisAlignment:
                    isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  if (!isUser && msg.personality != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        msg.personality!,
                        style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                      ),
                    ),
                  Text(
                    msg.content,
                    style: TextStyle(
                        color: isUser ? Colors.white : Colors.black87,
                        fontSize: 15),
                  ),
                  if (!isUser && msg.emotion != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        _getEmotionText(msg.emotion!),
                        style: TextStyle(
                            fontSize: 11,
                            color: _getEmotionColor(msg.emotion!)),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 18,
              backgroundColor: AppConfig.accentColor.withOpacity(0.2),
              child: Icon(Icons.person, size: 20, color: AppConfig.accentColor),
            ),
          ],
        ],
      ),
    );
  }

  String _getEmotionText(String emotion) {
    switch (emotion) {
      case 'interested':
        return '感兴趣';
      case 'curious':
        return '好奇';
      case 'happy':
        return '开心';
      case 'positive':
        return '积极';
      case 'neutral':
        return '中立';
      case 'encouraging':
        return '鼓励';
      case 'warm':
        return '温暖';
      case 'professional':
        return '专业';
      case 'analytical':
        return '分析';
      case 'sympathetic':
        return '同情';
      case 'angry':
        return '生气';
      case 'sad':
        return '难过';
      case 'hurt':
        return '受伤';
      case 'frustrated':
        return '沮丧';
      case 'forgiving':
        return '原谅';
      case 'expectant':
        return '期待';
      case 'excited':
        return '兴奋';
      case 'grateful':
        return '感激';
      case 'relieved':
        return '释然';
      case 'helpless':
        return '无助';
      default:
        return emotion;
    }
  }

  Color _getEmotionColor(String emotion) {
    switch (emotion) {
      case 'interested':
      case 'curious':
      case 'happy':
      case 'positive':
      case 'excited':
        return Colors.green;
      case 'encouraging':
      case 'warm':
      case 'grateful':
      case 'relieved':
        return Colors.orange;
      case 'neutral':
        return Colors.grey;
      case 'professional':
      case 'analytical':
        return Colors.blue;
      case 'sympathetic':
      case 'helpless':
        return Colors.purple;
      case 'angry':
      case 'hurt':
      case 'frustrated':
        return Colors.red;
      case 'sad':
        return Colors.blueGrey;
      case 'forgiving':
      case 'expectant':
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }
}

class _UIMessage {
  final String role;
  final String content;
  final String? emotion;
  final String? personality;

  _UIMessage(
      {required this.role,
      required this.content,
      this.emotion,
      this.personality});
}

class _Suggestion {
  final String type;
  final String content;

  _Suggestion({required this.type, required this.content});
}
