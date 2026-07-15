import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/coach_model.dart';
import '../../network/services/coach_service.dart';
import '../../widgets/common_widgets.dart';
import 'coach_detail_page.dart';
import 'custom_coach_page.dart';

/// 教练选择页面
/// 展示4个预设教练卡片（2×2网格布局），点击进入教练详情
class CoachListPage extends StatefulWidget {
  const CoachListPage({super.key});

  @override
  State<CoachListPage> createState() => _CoachListPageState();
}

class _CoachListPageState extends State<CoachListPage> {
  final _coachService = CoachService();
  List<CoachModel> _coaches = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCoaches();
  }

  Future<void> _loadCoaches() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final result = await _coachService.getCoachList();
      if (result.isSuccess && result.data != null) {
        setState(() {
          _coaches = result.data!;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = result.message.isNotEmpty ? result.message : '加载失败';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  /// 预设教练数据（本地兜底，后端未返回时使用）
  List<PresetCoachData> get _presetCoaches => [
    PresetCoachData(
      name: '沈清欢',
      tag: '温和知性姐姐型',
      style: '鼓励型',
      desc: '用温暖和理解，陪你走出社交舒适区',
      color: const Color(0xFFE8B4B8),
      icon: Icons.auto_awesome,
    ),
    PresetCoachData(
      name: '陆北辰',
      tag: '理性专业导师型',
      style: '分析型',
      desc: '理性拆解社交逻辑，帮你找到最优解',
      color: const Color(0xFF5B7DB1),
      icon: Icons.psychology,
    ),
    PresetCoachData(
      name: '顾星河',
      tag: '阳光活力伙伴型',
      style: '支持型',
      desc: '像朋友一样陪你练习，轻松无压力',
      color: const Color(0xFFF5A623),
      icon: Icons.wb_sunny,
    ),
    PresetCoachData(
      name: '苏念',
      tag: '细腻文艺朋友型',
      style: '鼓励型',
      desc: '细腻感知你的情绪，温柔引导你表达',
      color: const Color(0xFF9B8EC4),
      icon: Icons.local_florist,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('选择你的教练'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? loadingWidget()
          : _error != null
              ? errorWidget(message: _error!, onRetry: _loadCoaches)
              : _buildCoachGrid(),
    );
  }

  Widget _buildCoachGrid() {
    // 如果后端有数据，使用后端数据；否则使用本地预设
    final usePreset = _coaches.isEmpty;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '每位教练都有独特的性格和教学风格\n选择最适合你的，开始对练之旅',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.72,
            children: [
              ...usePreset
                  ? _presetCoaches.asMap().entries.map((e) => _buildPresetCard(e.value, e.key)).toList()
                  : _coaches.asMap().entries.map((e) => _buildCoachCard(e.value, e.key)).toList(),
              _buildCreateCustomCoachCard(),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPresetCard(PresetCoachData data, int index) {
    return GestureDetector(
      onTap: () => _onPresetCoachTap(data, index),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              data.color.withOpacity(0.15),
              data.color.withOpacity(0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: data.color.withOpacity(0.3), width: 1.5),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: data.color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(data.icon, size: 32, color: data.color),
              ),
              const SizedBox(height: 10),
              Text(
                data.name,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: data.color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  data.tag,
                  style: TextStyle(fontSize: 11, color: data.color.withOpacity(0.9)),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                data.style,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
              const SizedBox(height: 4),
              Text(
                data.desc,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey[500], height: 1.3),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCoachCard(CoachModel coach, int index) {
    final colors = [
      const Color(0xFFE8B4B8),
      const Color(0xFF5B7DB1),
      const Color(0xFFF5A623),
      const Color(0xFF9B8EC4),
    ];
    final icons = [
      Icons.auto_awesome,
      Icons.psychology,
      Icons.wb_sunny,
      Icons.local_florist,
    ];
    final color = colors[index % colors.length];
    final icon = icons[index % icons.length];

    return GestureDetector(
      onTap: () => _onCoachTap(coach),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              color.withOpacity(0.15),
              color.withOpacity(0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3), width: 1.5),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: color.withOpacity(0.2),
                backgroundImage: coach.avatar != null ? NetworkImage(coach.avatar!) : null,
                child: coach.avatar == null
                    ? Icon(icon, size: 32, color: color)
                    : null,
              ),
              const SizedBox(height: 10),
              Text(
                coach.displayName,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  coach.teachingStyleDisplayName,
                  style: TextStyle(fontSize: 11, color: color.withOpacity(0.9)),
                ),
              ),
              const SizedBox(height: 6),
              if (coach.occupation != null)
                Text(
                  coach.occupation!,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
            ],
          ),
        ),
      ),
    );
  }

  /// 创建自定义教练卡片
  Widget _buildCreateCustomCoachCard() {
    return GestureDetector(
      onTap: _onCreateCustomCoach,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppConfig.accentColor.withOpacity(0.4),
            width: 1.5,
            style: BorderStyle.solid,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppConfig.accentColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.add_circle_outline,
                  size: 32,
                  color: AppConfig.accentColor,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                '创建自定义教练',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '消耗100积分',
                style: TextStyle(fontSize: 12, color: AppConfig.accentColor),
              ),
              const SizedBox(height: 6),
              Text(
                '定制专属性格\n打造你的理想教练',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey[500], height: 1.3),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _onCreateCustomCoach() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const CustomCoachPage()),
    );
    if (result == true) {
      _loadCoaches(); // 创建成功后刷新教练列表
    }
  }

  void _onPresetCoachTap(PresetCoachData data, int index) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CoachDetailPage(
          presetData: data,
          presetIndex: index,
        ),
      ),
    );
  }

  void _onCoachTap(CoachModel coach) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CoachDetailPage(coach: coach),
      ),
    );
  }
}

/// 预设教练本地数据模型
class PresetCoachData {
  final String name;
  final String tag;
  final String style;
  final String desc;
  final Color color;
  final IconData icon;

  const PresetCoachData({
    required this.name,
    required this.tag,
    required this.style,
    required this.desc,
    required this.color,
    required this.icon,
  });
}
