
import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/coach_model.dart';
import '../../models/preset_coach_data.dart';
import '../../network/services/coach_service.dart';
import 'coach_detail_page.dart';

class CoachListPage extends StatefulWidget {
  const CoachListPage({super.key});

  @override
  State<CoachListPage> createState() => _CoachListPageState();
}

class _CoachListPageState extends State<CoachListPage> {
  final _coachService = CoachService();
  List<CoachModel> _coaches = [];
  bool _isLoading = true;

  final List<PresetCoachData> _presetCoaches = const [
    PresetCoachData(name: '沈清欢', style: '温柔鼓励型', color: Color(0xFFE8B4B8), icon: Icons.female),
    PresetCoachData(name: '陆北辰', style: '理性分析型', color: Color(0xFF5B7DB1), icon: Icons.business),
    PresetCoachData(name: '顾星河', style: '轻松幽默型', color: Color(0xFFF5A623), icon: Icons.mood),
    PresetCoachData(name: '苏念', style: '细腻共情型', color: Color(0xFF9B8EC4), icon: Icons.healing),
  ];

  @override
  void initState() {
    super.initState();
    _loadCoaches();
  }

  Future<void> _loadCoaches() async {
    setState(() => _isLoading = true);
    try {
      final result = await _coachService.getCoachList();
      if (result.isSuccess && result.data != null) {
        setState(() => _coaches = result.data!);
      }
    } catch (_) {
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('选择教练'),
        backgroundColor: AppConfig.primaryColor,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _coaches.isNotEmpty ? _coaches.length : _presetCoaches.length,
              itemBuilder: (context, index) {
                if (_coaches.isNotEmpty) {
                  return _buildCoachCard(_coaches[index]);
                }
                return _buildPresetCard(_presetCoaches[index], index);
              },
            ),
    );
  }

  Widget _buildCoachCard(CoachModel coach) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppConfig.primaryColor.withOpacity(0.1),
          child: const Icon(Icons.person),
        ),
        title: Text(coach.displayName),
        subtitle: Text(coach.expertise),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => CoachDetailPage(coach: coach)),
        ),
      ),
    );
  }

  Widget _buildPresetCard(PresetCoachData coach, int index) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: coach.color.withOpacity(0.1),
          child: Icon(coach.icon, color: coach.color),
        ),
        title: Text(coach.name),
        subtitle: Text(coach.style),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => CoachDetailPage(presetData: coach, presetIndex: index)),
        ),
      ),
    );
  }
}
