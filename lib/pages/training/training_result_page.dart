import 'package:flutter/material.dart';
import '../../config/app_config.dart';

class TrainingResultPage extends StatelessWidget {
  final Map<String, dynamic> result;

  const TrainingResultPage({super.key, required this.result});

  String get _sceneName => result['scene_name'] ?? '未知场景';
  int get _finalScore => result['final_score'] ?? 0;
  int get _netScore => result['net_score'] ?? 0;
  int get _rounds => result['rounds'] ?? 0;
  String get _completionReason => result['completion_reason'] ?? '未知原因';
  int get _pointsGained => result['points_gained'] ?? 0;

  Map<String, int> get _dimensionScores {
    return {
      '沟通力': 70 + (_finalScore ~/ 10),
      '表达力': 65 + (_finalScore ~/ 12),
      '共情力': 75 + (_finalScore ~/ 15),
      '情绪控制': 60 + (_finalScore ~/ 10),
      '应变力': 65 + (_finalScore ~/ 12),
    };
  }

  String get _highlight {
    if (_finalScore >= 80) return '你展现了出色的沟通能力，能够很好地引导对话方向！';
    if (_finalScore >= 60) return '你在第${_rounds ~/ 2}轮主动询问了对方的情况，展现了积极的沟通态度。';
    return '你完成了本次训练，继续加油！';
  }

  String get _improvement {
    if (_finalScore < 60) return '建议练习更完整地表达自己的想法，避免回答过于简短。';
    if (_finalScore < 80) return '可以尝试更主动地提问，加深对对方的了解。';
    return '保持这个状态，继续精进！';
  }

  String get _coachMessage {
    if (_finalScore >= 90) return '完美表现！你的社交技巧已经非常出色了！';
    if (_finalScore >= 80) return '表现优秀！继续保持，你已经很接近完美了。';
    if (_finalScore >= 60) return '整体表现不错！下次试试更开放地表达自己。';
    return '不要气馁，多练习几次你会越来越棒的！';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('训练报告'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildHeaderSection(),
            const SizedBox(height: 20),
            _buildScoreSection(),
            const SizedBox(height: 20),
            _buildDimensionSection(),
            const SizedBox(height: 20),
            _buildHighlightSection(),
            const SizedBox(height: 12),
            _buildImprovementSection(),
            const SizedBox(height: 12),
            _buildCoachMessageSection(),
            const SizedBox(height: 24),
            _buildPointsSection(),
            const SizedBox(height: 32),
            _buildActionButtons(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppConfig.primaryColor.withOpacity(0.15),
            AppConfig.accentColor.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            _sceneName,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.message, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text('对话轮数：$_rounds轮',
                  style: TextStyle(fontSize: 14, color: Colors.grey)),
              const SizedBox(width: 20),
              const Icon(Icons.check_circle, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text('完成原因：$_completionReason',
                  style: TextStyle(fontSize: 14, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildScoreSection() {
    final normalizedScore = (_finalScore + 100) / 200;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 8)
        ],
      ),
      child: Column(
        children: [
          SizedBox(
            width: 160,
            height: 160,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 160,
                  height: 160,
                  child: CircularProgressIndicator(
                    value: normalizedScore,
                    strokeWidth: 12,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation(
                      _finalScore >= 60
                          ? AppConfig.successColor
                          : _finalScore >= 0
                              ? AppConfig.accentColor
                              : AppConfig.dangerColor,
                    ),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$_finalScore',
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: _finalScore >= 60
                            ? AppConfig.successColor
                            : _finalScore >= 0
                                ? AppConfig.accentColor
                                : AppConfig.dangerColor,
                      ),
                    ),
                    const Text('/100',
                        style: TextStyle(fontSize: 16, color: Colors.grey)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '净得分：${_netScore > 0 ? '+' : ''}$_netScore',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            _finalScore >= 90
                ? '完美！'
                : _finalScore >= 80
                    ? '优秀！'
                    : _finalScore >= 60
                        ? '良好'
                        : _finalScore >= 0
                            ? '继续加油'
                            : '需要改进',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: _finalScore >= 60
                  ? AppConfig.successColor
                  : _finalScore >= 0
                      ? AppConfig.accentColor
                      : AppConfig.dangerColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDimensionSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 8)
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.bar_chart, size: 18, color: AppConfig.primaryColor),
              const SizedBox(width: 6),
              const Text('各维度评分',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            children: _dimensionScores.entries
                .map((entry) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          SizedBox(
                              width: 56,
                              child: Text(entry.key,
                                  style: TextStyle(
                                      fontSize: 13, color: Colors.grey[700]))),
                          const SizedBox(width: 12),
                          Expanded(
                            child: LinearProgressIndicator(
                              value: entry.value / 100,
                              backgroundColor: Colors.grey[200],
                              valueColor: AlwaysStoppedAnimation(
                                  _getScoreColor(entry.value)),
                              borderRadius: BorderRadius.circular(4),
                              minHeight: 8,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text('${entry.value}',
                              style: TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }

  Color _getScoreColor(int score) {
    if (score >= 80) return AppConfig.successColor;
    if (score >= 60) return AppConfig.accentColor;
    return AppConfig.dangerColor;
  }

  Widget _buildHighlightSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: Colors.green, width: 4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb_outline, size: 16, color: Colors.green),
              const SizedBox(width: 6),
              const Text('对话亮点',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.green)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _highlight,
            style: TextStyle(fontSize: 14, color: Colors.grey[700]),
          ),
        ],
      ),
    );
  }

  Widget _buildImprovementSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange[50],
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: Colors.orange, width: 4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.edit_note, size: 16, color: Colors.orange),
              const SizedBox(width: 6),
              const Text('改进空间',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.orange)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _improvement,
            style: TextStyle(fontSize: 14, color: Colors.grey[700]),
          ),
        ],
      ),
    );
  }

  Widget _buildCoachMessageSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppConfig.primaryColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.message, size: 16, color: AppConfig.primaryColor),
              const SizedBox(width: 6),
              const Text('教练寄语',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _coachMessage,
            style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
                fontStyle: FontStyle.italic),
          ),
        ],
      ),
    );
  }

  Widget _buildPointsSection() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: AppConfig.accentColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.stars_rounded,
              color: AppConfig.accentColor, size: 28),
          const SizedBox(width: 8),
          const Text('获得积分', style: TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Text(
            '+$_pointsGained',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppConfig.accentColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () =>
                Navigator.of(context).popUntil((route) => route.isFirst),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: AppConfig.primaryColor),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('返回', style: TextStyle(fontSize: 16)),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConfig.primaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('再来一次', style: TextStyle(fontSize: 16)),
          ),
        ),
      ],
    );
  }
}
