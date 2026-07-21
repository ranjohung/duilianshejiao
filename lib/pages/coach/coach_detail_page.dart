import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../config/app_config.dart';
import '../../models/coach_model.dart';
import '../scene/scene_select_page.dart';
import 'coach_list_page.dart';

/// 教练详情页面
/// 展示教练大头像、名称、性格维度雷达图、教学风格说明、开始训练按钮
class CoachDetailPage extends StatefulWidget {
  final CoachModel? coach;
  final PresetCoachData? presetData;
  final int? presetIndex;

  const CoachDetailPage(
      {super.key, this.coach, this.presetData, this.presetIndex});

  @override
  State<CoachDetailPage> createState() => _CoachDetailPageState();
}

class _CoachDetailPageState extends State<CoachDetailPage> {
  /// 性格维度数据（温暖度/专业度/幽默度/直接度）
  List<double> get _radarValues {
    if (widget.coach != null) {
      final p = widget.coach!.personalityConfig;
      return [
        p.decisionBasis == 'feeling' ? 0.85 : 0.4, // 温暖度
        p.infoProcessing == 'sensing' ? 0.9 : 0.5, // 专业度
        p.lifeAttitude == 'spontaneous' ? 0.8 : 0.3, // 幽默度
        p.decisionBasis == 'thinking' ? 0.85 : 0.4, // 直接度
      ];
    }
    // 预设教练的默认雷达值
    final index = widget.presetIndex ?? 0;
    const presets = [
      [0.9, 0.7, 0.6, 0.3], // 沈清欢：温暖高、直接低
      [0.4, 0.95, 0.3, 0.9], // 陆北辰：专业高、直接高
      [0.7, 0.5, 0.9, 0.5], // 顾星河：幽默高
      [0.85, 0.6, 0.5, 0.35], // 苏念：温暖高、直接低
    ];
    return presets[index];
  }

  String get _name =>
      widget.coach?.displayName ?? widget.presetData?.name ?? '';
  String get _style =>
      widget.coach?.teachingStyleDisplayName ?? widget.presetData?.style ?? '';
  Color get _themeColor {
    if (widget.presetData != null) return widget.presetData!.color;
    const colors = [
      Color(0xFFE8B4B8),
      Color(0xFF5B7DB1),
      Color(0xFFF5A623),
      Color(0xFF9B8EC4)
    ];
    return colors[0];
  }

  IconData get _icon {
    if (widget.presetData != null) return widget.presetData!.icon;
    return Icons.psychology;
  }

  String get _styleDesc {
    if (widget.coach?.systemPrompt != null) return widget.coach!.systemPrompt!;
    final index = widget.presetIndex ?? 0;
    const descs = [
      '温柔是你的力量。我会用鼓励和理解引导你，让你在安全感中逐步突破社交恐惧。每次练习都像和姐姐聊天一样轻松。',
      '社交是一门可以学习的技能。我会帮你分析对话逻辑，拆解社交策略，让你用理性面对每一次社交挑战。',
      '练习社交也可以很快乐！我会像朋友一样陪你聊天，在轻松的氛围中帮你积累社交经验，不知不觉就进步了。',
      '每个人内心都有想被理解的需求。我会细腻地感受你的情绪，引导你表达真实的自己，让社交变得自然而真诚。',
    ];
    return descs[index];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_name),
        backgroundColor: _themeColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // 教练大头像
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: _themeColor.withOpacity(0.15),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: _themeColor.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: widget.coach?.avatar != null
                  ? CircleAvatar(
                      radius: 50,
                      backgroundImage: NetworkImage(widget.coach!.avatar!),
                    )
                  : Icon(_icon, size: 50, color: _themeColor),
            ),
            const SizedBox(height: 12),
            Text(_name,
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: _themeColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(_style,
                  style: TextStyle(fontSize: 14, color: _themeColor)),
            ),
            const SizedBox(height: 24),

            // 性格维度雷达图
            Container(
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
                  const Text('性格维度',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 200,
                    child: RadarChart(
                      RadarChartData(
                        radarTouchData: RadarTouchData(enabled: false),
                        dataSets: [
                          RadarDataSet(
                            fillColor: _themeColor.withOpacity(0.25),
                            borderColor: _themeColor,
                            borderWidth: 2,
                            entryRadius: 4,
                            dataEntries: _radarValues
                                .map((v) => RadarEntry(value: v))
                                .toList(),
                          ),
                        ],
                        radarBackgroundColor: Colors.transparent,
                        radarBorderData:
                            const BorderSide(color: Colors.grey, width: 1),
                        gridBorderData:
                            const BorderSide(color: Colors.grey, width: 0.5),
                        tickBorderData:
                            const BorderSide(color: Colors.transparent),
                        ticksTextStyle: const TextStyle(fontSize: 0),
                        getTitle: (index, _) {
                          const titles = ['温暖度', '专业度', '幽默度', '直接度'];
                          return RadarChartTitle(text: titles[index]);
                        },
                        titlePositionFactorOffset: 0.2,
                        titleTextStyle: const TextStyle(
                            fontSize: 12, color: Colors.black54),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 教学风格说明
            Container(
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
                  const Text('教学风格',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(_styleDesc,
                      style: TextStyle(
                          fontSize: 14, color: Colors.grey[700], height: 1.6)),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // 开始训练按钮
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _onStartTraining,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _themeColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  elevation: 4,
                ),
                child: const Text('开始训练',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _onStartTraining() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SceneSelectPage(
          coachId: widget.coach?.id,
          coachName: _name,
          coachColor: _themeColor,
        ),
      ),
    );
  }
}
