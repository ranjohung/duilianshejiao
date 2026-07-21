import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../network/services/coach_service.dart';
import '../../network/api_response.dart';
import '../../widgets/common_widgets.dart';

/// 自定义教练创建页
/// 可设置教练名称、性格类型(4维度)、教学风格、口头禅
class CustomCoachPage extends StatefulWidget {
  const CustomCoachPage({super.key});

  @override
  State<CustomCoachPage> createState() => _CustomCoachPageState();
}

class _CustomCoachPageState extends State<CustomCoachPage> {
  final _coachService = CoachService();
  final _nameController = TextEditingController();
  final _catchphraseController = TextEditingController();

  // 性格维度：E/I, S/N, F/T, J/P
  String _socialEnergy = 'E'; // E=外向, I=内向
  String _infoProcessing = 'N'; // S=实感, N=直觉
  String _decisionBasis = 'F'; // F=情感, T=思维
  String _lifeAttitude = 'P'; // J=计划, P=随性

  String _teachingStyle = 'encouraging'; // 教学风格
  bool _isCreating = false;

  final List<Map<String, String>> _teachingStyles = [
    {'key': 'encouraging', 'label': '鼓励型', 'desc': '温暖支持，积极引导'},
    {'key': 'supportive', 'label': '支持型', 'desc': '陪伴成长，耐心倾听'},
    {'key': 'challenging', 'label': '挑战型', 'desc': '直接犀利，推动突破'},
    {'key': 'analytical', 'label': '分析型', 'desc': '理性拆解，逻辑清晰'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _catchphraseController.dispose();
    super.dispose();
  }

  Future<void> _createCoach() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      _showSnackBar('请输入教练名称');
      return;
    }
    if (name.length > 12) {
      _showSnackBar('教练名称不超过12个字');
      return;
    }

    setState(() => _isCreating = true);

    try {
      final result = await _coachService.createCustomCoach(
        name: name,
        teachingStyle: _teachingStyle,
        personalityConfig: {
          'socialEnergy': _socialEnergy == 'E' ? 'extrovert' : 'introvert',
          'infoProcessing': _infoProcessing == 'N' ? 'intuition' : 'sensing',
          'decisionBasis': _decisionBasis == 'F' ? 'feeling' : 'thinking',
          'lifeAttitude': _lifeAttitude == 'P' ? 'spontaneous' : 'planning',
        },
      );

      if (result.isSuccess) {
        if (mounted) {
          _showSnackBar('自定义教练创建成功！');
          Navigator.of(context).pop(true); // 返回true表示创建成功
        }
      } else {
        _showSnackBar(result.message.isNotEmpty ? result.message : '创建失败');
      }
    } catch (e) {
      _showSnackBar('创建失败：$e');
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 2)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('创建自定义教练'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 教练名称
            _buildSectionTitle('教练名称'),
            const SizedBox(height: 8),
            TextField(
              controller: _nameController,
              maxLength: 12,
              decoration: InputDecoration(
                hintText: '给你的教练起个名字',
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
            const SizedBox(height: 20),

            // 性格类型选择（4维度）
            _buildSectionTitle('性格类型'),
            const SizedBox(height: 8),
            _buildPersonalityDimension(
              '社交能量',
              '外向 E',
              '内向 I',
              _socialEnergy,
              (v) => setState(() => _socialEnergy = v),
            ),
            const SizedBox(height: 12),
            _buildPersonalityDimension(
              '信息处理',
              '实感 S',
              '直觉 N',
              _infoProcessing,
              (v) => setState(() => _infoProcessing = v),
            ),
            const SizedBox(height: 12),
            _buildPersonalityDimension(
              '决策依据',
              '情感 F',
              '思维 T',
              _decisionBasis,
              (v) => setState(() => _decisionBasis = v),
            ),
            const SizedBox(height: 12),
            _buildPersonalityDimension(
              '生活态度',
              '计划 J',
              '随性 P',
              _lifeAttitude,
              (v) => setState(() => _lifeAttitude = v),
            ),
            const SizedBox(height: 20),

            // 教学风格选择
            _buildSectionTitle('教学风格'),
            const SizedBox(height: 8),
            _buildTeachingStyleSelector(),
            const SizedBox(height: 20),

            // 口头禅
            _buildSectionTitle('一句话口头禅'),
            const SizedBox(height: 8),
            TextField(
              controller: _catchphraseController,
              maxLength: 30,
              decoration: InputDecoration(
                hintText: '教练的标志性台词',
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
            const SizedBox(height: 32),

            // 创建按钮
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isCreating ? null : _createCoach,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConfig.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  elevation: 4,
                ),
                child: _isCreating
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2),
                      )
                    : const Text(
                        '创建教练（消耗100积分）',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                '创建后将消耗100积分，请确认信息无误',
                style: TextStyle(fontSize: 12, color: Colors.grey[500]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    );
  }

  Widget _buildPersonalityDimension(
    String label,
    String leftLabel,
    String rightLabel,
    String currentValue,
    ValueChanged<String> onChanged,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 4)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildDimensionOption(
                    leftLabel, currentValue == leftLabel.split(' ').last, () {
                  onChanged(leftLabel.split(' ').last);
                }),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDimensionOption(
                    rightLabel, currentValue == rightLabel.split(' ').last, () {
                  onChanged(rightLabel.split(' ').last);
                }),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDimensionOption(
      String label, bool selected, VoidCallback onTap) {
    final color = selected ? AppConfig.primaryColor : Colors.grey[300]!;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected
              ? AppConfig.primaryColor.withOpacity(0.1)
              : Colors.grey[50],
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color, width: 1.5),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              color: selected ? AppConfig.primaryColor : Colors.grey[600],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTeachingStyleSelector() {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: _teachingStyles.map((style) {
        final selected = _teachingStyle == style['key'];
        final color = selected ? AppConfig.primaryColor : Colors.grey[300]!;
        return GestureDetector(
          onTap: () => setState(() => _teachingStyle = style['key']!),
          child: Container(
            width: (MediaQuery.of(context).size.width - 60) / 2,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: selected
                  ? AppConfig.primaryColor.withOpacity(0.08)
                  : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color, width: 1.5),
              boxShadow: [
                BoxShadow(color: Colors.grey.withOpacity(0.08), blurRadius: 4)
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  style['label']!,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: selected ? AppConfig.primaryColor : Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  style['desc']!,
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
