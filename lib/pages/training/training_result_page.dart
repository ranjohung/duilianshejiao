import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../config/app_config.dart';

/// 训练结果页面
/// 展示评分+三星评价、五维度雷达图、教练点评、获得积分、操作按钮
class TrainingResultPage extends StatelessWidget {
  final Map<String, dynamic> result;

  const TrainingResultPage({super.key, required this.result});

  double get _score => (result['score'] ?? 0).toDouble();
  int get _stars => result['starRating'] ?? 0;
  String get _coachComment => result['coachComment'] ?? '继续加油，下次会更好！';
  int get _points => result['points'] ?? 10;
  String get _coachName => result['coachName'] ?? '教练';

  /// 五维度得分：沟通力/表达力/共情力/情绪控制/应变力
  List<double> get _dimensionValues {
    final scores = result['dimensionScores'] as Map<String, dynamic>?;
    return [
      (scores?['communication'] ?? 0.5).toDouble(),
      (scores?['expression'] ?? 0.5).toDouble(),
      (scores?['empathy'] ?? 0.5).toDouble(),
      (scores?['emotionControl'] ?? 0.5).toDouble(),
      (scores?['adaptability'] ?? 0.5).toDouble(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('训练结果'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // 评分+三星
            _buildScoreSection(),
            const SizedBox(height: 24),

            // 五维度雷达图
            _buildRadarSection(),
            const SizedBox(height: 24),

            // 教练点评
            _buildCommentSection(),
            const SizedBox(height: 24),

            // 获得积分
            _buildPointsSection(),
            const SizedBox(height: 32),

            // 操作按钮
            _buildActionButtons(context),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppConfig.primaryColor.withOpacity(0.1),
            AppConfig.accentColor.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          // 分数圆环
          SizedBox(
            width: 140,
            height: 140,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 140,
                  height: 140,
                  child: CircularProgressIndicator(
                    value: _score / 100,
                    strokeWidth: 10,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation(
                      _score >= 80
                          ? AppConfig.successColor
                          : _score >= 60
                              ? AppConfig.accentColor
                              : AppConfig.dangerColor,
                    ),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _score.toInt().toString(),
                      style: const TextStyle(
                          fontSize: 40, fontWeight: FontWeight.bold),
                    ),
                    const Text('分',
                        style: TextStyle(fontSize: 14, color: Colors.grey)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // 三星评价
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (i) {
              return Icon(
                i < _stars ? Icons.star_rounded : Icons.star_outline_rounded,
                size: 36,
                color: i < _stars ? AppConfig.accentColor : Colors.grey[300],
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildRadarSection() {
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
          const Text('能力维度',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          SizedBox(
            height: 220,
            child: RadarChart(
              RadarChartData(
                radarTouchData: RadarTouchData(enabled: false),
                dataSets: [
                  RadarDataSet(
                    fillColor: AppConfig.primaryColor.withOpacity(0.25),
                    borderColor: AppConfig.primaryColor,
                    borderWidth: 2,
                    entryRadius: 4,
                    dataEntries: _dimensionValues
                        .map((v) => RadarEntry(value: v))
                        .toList(),
                  ),
                ],
                radarBackgroundColor: Colors.transparent,
                radarBorderData: const BorderSide(color: Colors.grey, width: 1),
                gridBorderData:
                    const BorderSide(color: Colors.grey, width: 0.5),
                tickBorderData: const BorderSide(color: Colors.transparent),
                ticksTextStyle: const TextStyle(fontSize: 0),
                getTitle: (index, _) {
                  const titles = ['沟通力', '表达力', '共情力', '情绪控制', '应变力'];
                  return RadarChartTitle(text: titles[index]);
                },
                titlePositionFactorOffset: 0.2,
                titleTextStyle:
                    const TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 8)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.chat_bubble_outline,
                  size: 18, color: AppConfig.primaryColor),
              const SizedBox(width: 6),
              Text('$_coachName点评',
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            _coachComment,
            style:
                TextStyle(fontSize: 14, color: Colors.grey[700], height: 1.6),
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
            '+$_points',
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
