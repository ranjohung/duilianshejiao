import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../config/app_config.dart';
import '../../models/coach_model.dart';
import '../../models/scene_model.dart';
import '../../models/training_model.dart';
import '../../network/services/training_service.dart';

/// 对话训练主页面 - 微信聊天风格
/// 核心页面：场景名称+教练名称+训练进度、对话消息列表、输入区域、选项区域、反馈区域
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

  List<_UIMessage> _messages = [];
  bool _isLoading = false;
  bool _isSending = false;
  String? _sessionId;
  int _currentRound = 0;
  int _totalRounds = 0;
  int _currentScore = 0;
  int _totalScore = 50;
  List<String>? _options;
  String? _feedbackContent;
  int? _feedbackScoreDelta;
  String? _feedbackTip;
  bool _showFeedback = false;
  DateTime _trainingStartTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    _startTraining();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _startTraining() async {
    setState(() => _isLoading = true);
    try {
      final result = await _trainingService.startTraining(
        coachId: widget.coach.id,
        sceneId: widget.scene.id,
      );
      setState(() {
        _sessionId = result['sessionId'] ?? result['trainingId'];
        _currentRound = result['currentRound'] ?? 1;
        _totalRounds = result['totalRounds'] ?? widget.scene.rounds;
        _currentScore = result['currentScore'] ?? 0;
        _trainingStartTime = DateTime.now();
      });
      if (result['message'] != null) {
        _addMessage(_UIMessage(
          role: 'assistant',
          content: result['message'] as String,
          options: result['options'] != null ? List<String>.from(result['options']) : null,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('启动训练失败: $e')));
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _sendMessage(String text, {int? choiceIndex}) async {
    if (text.trim().isEmpty || _isSending) return;

    _addMessage(_UIMessage(role: 'user', content: text.trim()));
    _messageController.clear();
    setState(() {
      _options = null;
      _isSending = true;
      _showFeedback = false;
    });

    try {
      final result = await _trainingService.sendMessage(
        sessionId: _sessionId!,
        message: text.trim(),
      );

      setState(() {
        if (result['feedback'] != null) {
          _feedbackContent = result['feedback']['choice_analysis']?.toString();
          _feedbackScoreDelta = result['feedback']['score_delta'] as int?;
          _currentScore += _feedbackScoreDelta ?? 0;
          _showFeedback = true;
          _feedbackTip = result['feedback']['tip']?.toString();

          Future.delayed(const Duration(milliseconds: 2000), () {
            if (mounted) {
              setState(() {
                _showFeedback = false;
              });
            }
          });
        }
      });

      if (result['message'] != null) {
        await Future.delayed(const Duration(milliseconds: 1500));
        _addMessage(_UIMessage(
          role: 'assistant',
          content: result['message'] as String,
          options: result['options'] != null ? List<String>.from(result['options']) : null,
        ));
      }

      setState(() {
        _currentRound = result['currentRound'] ?? _currentRound;
        _options = result['options'] != null ? List<String>.from(result['options']) : null;
        if (result['isFinished'] == true) {
          _endTraining();
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('发送失败: $e')));
      }
    } finally {
      setState(() => _isSending = false);
    }
    _scrollToBottom();
  }

  void _selectOption(int index) {
    if (_options == null || _options!.length <= index) return;
    _sendMessage(_options![index], choiceIndex: index);
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

  Future<void> _endTraining() async {
    if (_sessionId == null) return;
    try {
      final result = await _trainingService.endTraining(_sessionId!);
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/training-result', arguments: result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('结束训练失败: $e')));
      }
    }
  }

  void _confirmEndTraining() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('结束训练'),
        content: const Text('确定要提前结束本次训练吗？当前进度将不会保存。'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('继续训练')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.of(context).pop();
            },
            child: const Text('确定结束', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  String _formatDuration() {
    final duration = DateTime.now().difference(_trainingStartTime);
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: _confirmEndTraining,
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.scene.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(
              '${widget.coach.displayName} · 阶段${widget.scene.stage}',
              style: const TextStyle(fontSize: 12, opacity: 0.8),
            ),
          ],
        ),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        centerTitle: false,
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Text(
                  _formatDuration(),
                  style: const TextStyle(fontSize: 12, opacity: 0.8),
                ),
                const SizedBox(width: 16),
                Text(
                  '$_currentRound/$_totalRounds',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.stop_circle_outlined),
                  onPressed: _confirmEndTraining,
                  tooltip: '结束训练',
                ),
              ],
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(color: AppConfig.primaryColor),
                SizedBox(height: 16),
                Text('正在进入训练场景...', style: TextStyle(color: Colors.grey)),
              ],
            ))
          : Column(
              children: [
                LinearProgressIndicator(
                  value: _totalRounds > 0 ? _currentRound / _totalRounds : 0,
                  backgroundColor: Colors.grey[100],
                  valueColor: const AlwaysStoppedAnimation(AppConfig.accentColor),
                  minHeight: 4,
                ),
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) => _buildMessageBubble(_messages[index]),
                  ),
                ),
                if (_showFeedback) _buildFeedbackArea(),
                if (_options != null && _options!.isNotEmpty && !_showFeedback) _buildOptionArea(),
                _buildInputArea(),
                if (_currentRound > 0) _buildScoreBar(),
              ],
            ),
    );
  }

  Widget _buildMessageBubble(_UIMessage msg) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 18,
              backgroundColor: AppConfig.primaryColor.withOpacity(0.1),
              child: Icon(Icons.person, size: 20, color: AppConfig.primaryColor),
            ),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    isUser ? '我' : widget.coach.displayName,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser ? AppConfig.primaryColor : Colors.grey[100],
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isUser ? 18 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 18),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 2,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Text(
                    msg.content,
                    style: TextStyle(
                      color: isUser ? Colors.white : Colors.black87,
                      fontSize: 15,
                      height: 1.4,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    DateFormat('HH:mm').format(DateTime.now()),
                    style: TextStyle(fontSize: 10, color: Colors.grey[400]),
                  ),
                ),
              ],
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 10),
            CircleAvatar(
              radius: 18,
              backgroundColor: Colors.grey[200],
              child: const Icon(Icons.account_circle, size: 20, color: Colors.grey[500]),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOptionArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.grey[50],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline, size: 16, color: AppConfig.accentColor),
                const SizedBox(width: 6),
                const Text('选择你的回应方式：', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          ..._options!.asMap().entries.map((e) => _buildOptionCard(e.value, e.key)).toList(),
        ],
      ),
    );
  }

  Widget _buildOptionCard(String text, int index) {
    final labels = ['A', 'B', 'C'];
    return GestureDetector(
      onTap: _isSending ? null : () => _selectOption(index),
      child: Container(
        padding: const EdgeInsets.all(14),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [BoxShadow(blurRadius: 4, color: Colors.black.withOpacity(0.05))],
        ),
        child: Row(
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: AppConfig.primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  labels[index],
                  style: TextStyle(color: AppConfig.primaryColor, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(fontSize: 14, color: Colors.black87, height: 1.4),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeedbackArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      color: AppConfig.accentColor.withOpacity(0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _feedbackContent ?? '',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.black87),
                ),
              ),
            ],
          ),
          if (_feedbackScoreDelta != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.trending_up, color: AppConfig.accentColor, size: 18),
                const SizedBox(width: 6),
                Text(
                  '得分 ${_feedbackScoreDelta! > 0 ? '+' : ''}$_feedbackScoreDelta (累计: $_currentScore/$_totalScore)',
                  style: TextStyle(fontSize: 13, color: _feedbackScoreDelta! >= 0 ? Colors.green : Colors.red),
                ),
              ],
            ),
          ],
          if (_feedbackTip != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.lightbulb, color: AppConfig.accentColor, size: 16),
                const SizedBox(width: 6),
                Text(
                  '💡 $_feedbackTip',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 4)],
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, size: 28, color: Colors.grey[500]),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('附件功能开发中')),
              );
            },
          ),
          const SizedBox(width: 4),
          Expanded(
            child: TextField(
              controller: _messageController,
              enabled: !_isSending,
              decoration: const InputDecoration(
                hintText: '也可以自己输入...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(20)),
                  borderSide: BorderSide(color: Colors.grey),
                ),
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              onSubmitted: _sendMessage,
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: _isSending
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                : Icon(Icons.send, color: AppConfig.primaryColor, size: 24),
            onPressed: _isSending ? null : () => _sendMessage(_messageController.text),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '评分区：本轮得分 ${_feedbackScoreDelta != null ? (_feedbackScoreDelta! > 0 ? '+' : '') + _feedbackScoreDelta.toString() : '-'}',
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
          Text(
            '累计得分 $_currentScore/$_totalScore',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppConfig.accentColor),
          ),
        ],
      ),
    );
  }
}

/// 页面内使用的消息模型
class _UIMessage {
  final String role;
  final String content;
  final List<String>? options;

  _UIMessage({required this.role, required this.content, this.options});
}