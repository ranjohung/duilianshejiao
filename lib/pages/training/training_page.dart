import 'dart:async';

import 'package:flutter/material.dart';

import '../../config/app_config.dart';
import '../../models/coach_model.dart';
import '../../models/scene_model.dart';
import '../../network/services/training_service.dart';
import '../../widgets/immersive_stage.dart';

/// 训练模式：决定输入前是否展示 A/B/C 参考选项
/// - [etiquette] 礼仪/社交训练：输入前有 A/B/C 参考选项，可点选也可自由输入
/// - [challenge] 真实挑战：输入前无任何提示，只有输入后才有教练评价
enum TrainingMode { etiquette, challenge }

/// 对话训练主页面 - 沉浸式 3D 舞台风格
///
/// 对齐 Web 原型 index.html 的 Stage3D 设计：
/// - 主角 + NPC 站在对应真实建筑场景中（咖啡厅/办公室/家宴/婚礼…）
/// - 对话以游戏式气泡锚定在角色头顶，带小尾巴
/// - 顶部信息条、本关目标卡、教练评价卡、悬浮输入坞
class TrainingPage extends StatefulWidget {
  final CoachModel coach;
  final SceneModel scene;

  /// 训练模式，默认礼仪训练（输入前有 A/B/C）
  final TrainingMode mode;

  const TrainingPage({
    super.key,
    required this.coach,
    required this.scene,
    this.mode = TrainingMode.etiquette,
  });

  @override
  State<TrainingPage> createState() => _TrainingPageState();
}

class _TrainingPageState extends State<TrainingPage> {
  final _messageController = TextEditingController();
  final _trainingService = TrainingService();
  Timer? _timer;

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
  int _remainingTimeTravel = 0;
  bool _canUseHint = true;
  DateTime _trainingStartTime = DateTime.now();

  bool get _isChallengeMode => widget.mode == TrainingMode.challenge;

  @override
  void initState() {
    super.initState();
    _startTraining();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _messageController.dispose();
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
        _remainingTimeTravel = result['remainingTimeTravel'] ?? 0;
        _canUseHint = result['canUseHint'] ?? true;
      });
      if (result['message'] != null) {
        _addMessage(_UIMessage(
          role: 'assistant',
          content: result['message'] as String,
        ));
      }
      // 真实挑战模式：输入前不展示任何提示选项
      if (result['options'] != null && !_isChallengeMode) {
        setState(() {
          _options = List<String>.from(result['options']);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('启动训练失败: $e')));
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
        choiceIndex: choiceIndex,
      );

      setState(() {
        if (result['feedback'] != null) {
          _feedbackContent = result['feedback']['content']?.toString();
          _feedbackScoreDelta = result['feedback']['score_delta'] as int?;
          _currentScore += _feedbackScoreDelta ?? 0;
          _showFeedback = true;
          _feedbackTip = result['feedback']['tip']?.toString();
        }
      });

      if (result['message'] != null) {
        await Future.delayed(const Duration(milliseconds: 1200));
        _addMessage(_UIMessage(
          role: 'assistant',
          content: result['message'] as String,
        ));
      }

      setState(() {
        _currentRound = result['currentRound'] ?? _currentRound;
        // 真实挑战模式始终不给输入前提示
        _options = (!_isChallengeMode && result['options'] != null)
            ? List<String>.from(result['options'])
            : null;
        if (result['isFinished'] == true) {
          _endTraining();
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('发送失败: $e')));
      }
    } finally {
      setState(() => _isSending = false);
    }
  }

  void _selectOption(int index) {
    if (_options == null || _options!.length <= index) return;
    _sendMessage(_options![index], choiceIndex: index);
  }

  void _addMessage(_UIMessage msg) {
    setState(() => _messages.add(_UIMessage(
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ?? DateTime.now(),
        )));
  }

  Future<void> _endTraining() async {
    if (_sessionId == null) return;
    try {
      final result = await _trainingService.endTraining(_sessionId!);
      if (mounted) {
        Navigator.of(context)
            .pushReplacementNamed('/training-result', arguments: result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('结束训练失败: $e')));
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
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('继续训练')),
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

  String get _npcName {
    final npc = widget.scene.npcName;
    return npc.isEmpty ? widget.coach.displayName : npc;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F2FB),
      body: _isLoading
          ? const Center(
              child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(color: AppConfig.primaryColor),
                SizedBox(height: 16),
                Text('正在进入训练场景...', style: TextStyle(color: Colors.grey)),
              ],
            ))
          : SafeArea(
              bottom: false,
              child: Column(
                children: [
                  _buildHeader(),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildStage(),
                          _buildGoalCard(),
                          if (_showFeedback) _buildFeedbackCard(),
                          if (_options != null &&
                              _options!.isNotEmpty &&
                              !_showFeedback)
                            _buildOptionArea(),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  ),
                  _buildInputDock(),
                  if (_currentRound > 0) _buildScoreBar(),
                ],
              ),
            ),
    );
  }

  // ---------- 顶部信息条 ----------
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [
          Color(0xFF5A4BDA),
          Color(0xFF6C5CE7),
        ]),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
            onPressed: _confirmEndTraining,
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      widget.scene.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _isChallengeMode ? '真实挑战' : '礼仪训练',
                        style:
                            const TextStyle(color: Colors.white, fontSize: 10),
                      ),
                    ),
                  ],
                ),
                Text(
                  '${widget.coach.displayName} · ${widget.scene.stageDisplay}',
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.8), fontSize: 11),
                ),
              ],
            ),
          ),
          Row(
            children: [
              Icon(Icons.timer_outlined,
                  size: 14, color: Colors.white.withOpacity(0.85)),
              const SizedBox(width: 2),
              Text(_formatDuration(),
                  style: TextStyle(
                      fontSize: 11, color: Colors.white.withOpacity(0.85))),
              const SizedBox(width: 10),
              Text('进度',
                  style: TextStyle(
                      fontSize: 11, color: Colors.white.withOpacity(0.85))),
              const SizedBox(width: 2),
              Text('$_currentRound/$_totalRounds',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold)),
              const SizedBox(width: 6),
              IconButton(
                icon: Icon(Icons.stop_circle_outlined,
                    size: 20, color: Colors.white.withOpacity(0.9)),
                onPressed: _confirmEndTraining,
                tooltip: '结束训练',
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------- 沉浸式 3D 舞台 + 头顶气泡 ----------
  Widget _buildStage() {
    final bubbles = <StageBubbleData>[];
    for (final msg in _messages) {
      bubbles.add(StageBubbleData(
        speaker: msg.role == 'user' ? 'user' : 'npc',
        text: msg.content,
      ));
    }
    final last = _messages.isNotEmpty ? _messages.last : null;
    final speaking =
        last == null ? null : (last.role == 'user' ? 'user' : 'npc');

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      height: 300,
      child: Stack(
        children: [
          ImmersiveStage(
            environment: StageEnvironment.fromScene(widget.scene),
            npcName: _npcName,
            npcTitle: widget.scene.stageDisplay,
            userName: '我',
            bubbles: bubbles,
            speaking: speaking,
          ),
          // 场景标签
          Positioned(
            left: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.35),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '沉浸式现场 · ${_environmentLabel()}',
                style: const TextStyle(color: Colors.white, fontSize: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _environmentLabel() {
    switch (StageEnvironment.fromScene(widget.scene)) {
      case StageEnvironment.office:
        return '办公室';
      case StageEnvironment.cafe:
        return '咖啡厅';
      case StageEnvironment.family:
        return '家宴餐厅';
      case StageEnvironment.restaurant:
        return '宴请包厢';
      case StageEnvironment.wedding:
        return '婚礼现场';
      case StageEnvironment.bar:
        return '清吧';
      case StageEnvironment.corridor:
        return '社区楼道';
      case StageEnvironment.generic:
        return '会客厅';
    }
  }

  // ---------- 本关目标卡 ----------
  Widget _buildGoalCard() {
    final tip =
        widget.scene.teachingPoint ?? widget.scene.descriptionOrTeaching;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.flag, size: 14, color: Color(0xFF6C5CE7)),
              const SizedBox(width: 4),
              const Text('本关目标 · 教学重点',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF5A4BDA))),
              const Spacer(),
              if (_isChallengeMode)
                const Text('本模式输入前无提示',
                    style: TextStyle(fontSize: 10, color: Colors.orange))
              else
                const Text('输入前提供 A/B/C 参考',
                    style: TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
          if (tip.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(tip,
                style: const TextStyle(
                    fontSize: 12, color: Colors.black87, height: 1.5)),
          ],
        ],
      ),
    );
  }

  // ---------- 教练评价卡 ----------
  Widget _buildFeedbackCard() {
    final delta = _feedbackScoreDelta ?? 0;
    final good = delta >= 0;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: good ? const Color(0xFF4CAF50) : const Color(0xFFF44336),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 12,
                backgroundColor: const Color(0xFF6C5CE7).withOpacity(0.12),
                child: const Icon(Icons.sports,
                    size: 14, color: Color(0xFF6C5CE7)),
              ),
              const SizedBox(width: 8),
              Text('${widget.coach.displayName} 的点评',
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.bold)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (good ? Colors.green : Colors.red).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${delta > 0 ? '+' : ''}$delta 分',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: good
                        ? const Color(0xFF2E7D32)
                        : const Color(0xFFC62828),
                  ),
                ),
              ),
            ],
          ),
          if (_feedbackContent != null && _feedbackContent!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('💬 ', style: TextStyle(fontSize: 12)),
                Expanded(
                  child: Text(_feedbackContent!,
                      style: const TextStyle(
                          fontSize: 13, height: 1.5, color: Colors.black87)),
                ),
              ],
            ),
          ],
          if (_feedbackTip != null && _feedbackTip!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('💡 ', style: TextStyle(fontSize: 12)),
                Expanded(
                  child: Text(_feedbackTip!,
                      style: TextStyle(
                          fontSize: 12, height: 1.5, color: Colors.grey[700])),
                ),
              ],
            ),
          ],
          const SizedBox(height: 6),
          Text('累计得分 $_currentScore/$_totalScore',
              style: const TextStyle(fontSize: 11, color: Colors.grey)),
        ],
      ),
    );
  }

  // ---------- A/B/C 参考选项（礼仪模式） ----------
  Widget _buildOptionArea() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('🧭', style: TextStyle(fontSize: 14)),
              const SizedBox(width: 4),
              const Text('参考回应（可点选，也可自己输入）',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF5A4BDA))),
            ],
          ),
          const SizedBox(height: 10),
          ..._options!
              .asMap()
              .entries
              .map((e) => _buildOptionCard(e.value, e.key))
              .toList(),
        ],
      ),
    );
  }

  Widget _buildOptionCard(String text, int index) {
    final labels = ['A', 'B', 'C'];
    return GestureDetector(
      onTap: _isSending ? null : () => _selectOption(index),
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFAF9FF),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE4E0F7)),
        ),
        child: Row(
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: const BoxDecoration(
                color: Color(0xFF6C5CE7),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  labels[index],
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                    fontSize: 13, color: Colors.black87, height: 1.4),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------- 悬浮输入坞 ----------
  Widget _buildInputDock() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildItemButton(
              '⏳', _remainingTimeTravel, () => _useItem('time_shuttle')),
          const SizedBox(width: 4),
          _buildItemButton(
              '💡', _canUseHint ? 1 : 0, () => _useItem('hint_card')),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _messageController,
              enabled: !_isSending,
              minLines: 1,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: _isChallengeMode ? '直接输入你的回应…' : '也可以自己输入…',
                filled: true,
                fillColor: const Color(0xFFF4F2FB),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
              ),
              onSubmitted: _sendMessage,
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap:
                _isSending ? null : () => _sendMessage(_messageController.text),
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                    colors: [Color(0xFF5A4BDA), Color(0xFF6C5CE7)]),
                shape: BoxShape.circle,
              ),
              child: _isSending
                  ? const Padding(
                      padding: EdgeInsets.all(10),
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_rounded,
                      color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemButton(String icon, int count, VoidCallback onPressed) {
    return InkWell(
      onTap: count > 0 && !_isSending ? onPressed : null,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: count > 0 && !_isSending
              ? const Color(0xFFF4F2FB)
              : Colors.grey[100],
          borderRadius: BorderRadius.circular(18),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 18)),
            if (count > 0)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppConfig.accentColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    count.toString(),
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _useItem(String itemId) async {
    if (_sessionId == null) return;
    try {
      final result = await _trainingService.useItem(
        sessionId: _sessionId!,
        itemId: itemId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['effect'] ?? '道具使用成功')),
        );
      }

      setState(() {
        if (itemId == 'time_shuttle') {
          _remainingTimeTravel = result['remaining'] ?? 0;
        } else if (itemId == 'hint_card') {
          _canUseHint = false;
        }

        if (result['hint'] != null) {
          _feedbackTip = result['hint'];
          _showFeedback = true;
          Future.delayed(const Duration(milliseconds: 3000), () {
            if (mounted) {
              setState(() {
                _showFeedback = false;
              });
            }
          });
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('使用道具失败: $e')));
      }
    }
  }

  Widget _buildScoreBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      color: const Color(0xFFF4F2FB),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '评分区：本轮得分 ${_feedbackScoreDelta != null ? (_feedbackScoreDelta! > 0 ? '+' : '') + _feedbackScoreDelta.toString() : '-'}',
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
          Text(
            '累计得分 $_currentScore/$_totalScore',
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFF5A4BDA)),
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
  final DateTime? timestamp;

  _UIMessage({
    required this.role,
    required this.content,
    this.timestamp,
  });
}
