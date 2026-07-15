import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/coach_model.dart';
import '../../models/scene_model.dart';
import '../../models/training_model.dart';
import '../../network/services/training_service.dart';

/// 对话训练主页面
/// 核心页面：场景名称+教练名称+训练进度、对话消息列表、输入区域
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
  String? _trainingId;
  int _currentRound = 0;
  int _totalRounds = 0;
  List<String>? _options;

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
        _trainingId = result['trainingId'];
        _currentRound = result['currentRound'] ?? 1;
        _totalRounds = result['totalRounds'] ?? widget.scene.rounds;
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

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty || _isSending) return;

    _addMessage(_UIMessage(role: 'user', content: text.trim()));
    _messageController.clear();
    setState(() {
      _options = null;
      _isSending = true;
    });

    try {
      final result = await _trainingService.sendMessage(
        trainingId: _trainingId!,
        message: text.trim(),
      );
      _addMessage(_UIMessage(
        role: 'assistant',
        content: result['message'] as String,
        options: result['options'] != null ? List<String>.from(result['options']) : null,
      ));
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
    if (_trainingId == null) return;
    try {
      final result = await _trainingService.endTraining(_trainingId!);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.scene.name} · 第$_currentRound轮'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.stop_circle_outlined),
            onPressed: _confirmEndTraining,
            tooltip: '结束训练',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('正在进入训练场景...', style: TextStyle(color: Colors.grey)),
              ],
            ))
          : Column(
              children: [
                // 训练进度条
                LinearProgressIndicator(
                  value: _totalRounds > 0 ? _currentRound / _totalRounds : 0,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation(AppConfig.accentColor),
                ),
                // 场景信息条
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  color: Colors.grey[50],
                  child: Row(
                    children: [
                      Icon(Icons.psychology, size: 16, color: AppConfig.primaryColor),
                      const SizedBox(width: 4),
                      Text(widget.coach.displayName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                      const Spacer(),
                      Text(
                        '$_currentRound/$_totalRounds轮',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                // 消息列表
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) => _buildMessageBubble(_messages[index]),
                  ),
                ),
                // 选项按钮
                if (_options != null && _options!.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Column(
                      children: _options!.asMap().entries.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: _isSending ? null : () => _sendMessage(e.value),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: AppConfig.primaryColor),
                              alignment: Alignment.centerLeft,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                            child: Text(
                              '${['A', 'B', 'C'][e.key]}. ${e.value}',
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                        ),
                      )).toList(),
                    ),
                  ),
                // 输入区域
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.2), blurRadius: 4)],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _messageController,
                          enabled: !_isSending && (_options == null || _options!.isEmpty),
                          decoration: const InputDecoration(
                            hintText: '输入你的回复...',
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                          onSubmitted: _sendMessage,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: _isSending
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : Icon(Icons.send, color: AppConfig.primaryColor),
                        onPressed: _isSending ? null : () => _sendMessage(_messageController.text),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildMessageBubble(_UIMessage msg) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: AppConfig.primaryColor.withOpacity(0.1),
              child: Icon(Icons.psychology, size: 18, color: AppConfig.primaryColor),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? AppConfig.primaryColor : Colors.grey[100],
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: Text(
                msg.content,
                style: TextStyle(color: isUser ? Colors.white : Colors.black87, fontSize: 15),
              ),
            ),
          ),
          if (isUser) const SizedBox(width: 8),
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
