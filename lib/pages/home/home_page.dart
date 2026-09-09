import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/app_config.dart';
import '../scene/scene_select_page.dart';

/// 首页：优先展示上次训练，并提供可自由选择的训练项目。
/// 当前 Flutter 端使用本地演示数据；正式推荐和训练记录由服务端提供。
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String? _lastTraining;
  String? _selectedProject;

  static const _projects = [
    ('初次见面', '自然打招呼与自我介绍', Icons.waving_hand_rounded, Color(0xFFE8F0FE)),
    ('加薪谈判', '清晰表达价值与诉求', Icons.trending_up_rounded, Color(0xFFFFF3E0)),
    ('相亲模拟', '破冰、倾听与话题推进', Icons.favorite_rounded, Color(0xFFFCE4EC)),
    ('客户投诉应对', '共情回应并解决问题', Icons.support_agent_rounded, Color(0xFFE8F5E9)),
  ];

  @override
  void initState() {
    super.initState();
    _loadLastTraining();
  }

  Future<void> _loadLastTraining() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _lastTraining = prefs.getString('last_training_name');
      _selectedProject = prefs.getString('selected_training_name');
    });
  }

  Future<void> _openTraining(String name) async {
    final prefs = await SharedPreferences.getInstance();
    if (_selectedProject != null && _selectedProject != name) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('该项目尚未解锁：可用训练积分或时空穿梭券解锁')),
        );
      }
      return;
    }
    final selectedProject = _selectedProject ?? name;
    await prefs.setString('selected_training_name', selectedProject);
    await prefs.setString('last_training_name', name);
    if (!mounted) return;
    setState(() {
      _lastTraining = name;
      _selectedProject = selectedProject;
    });
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SceneSelectPage(
          coachName: '教练',
          coachColor: AppConfig.primaryColor,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            _buildHeader(),
            const SizedBox(height: 18),
            if (_lastTraining != null) _buildLastTraining(),
            _buildProjectSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppConfig.primaryColor, Color(0xFF2A5298)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.all(Radius.circular(22)),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 28,
            backgroundColor: Colors.white24,
            child: Icon(Icons.person_rounded, color: Colors.white, size: 34),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('晚上好', style: TextStyle(color: Colors.white70, fontSize: 14)),
                SizedBox(height: 3),
                Text('准备好开始练习了吗？', style: TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: const BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.all(Radius.circular(14))),
            child: const Row(children: [Icon(Icons.star_rounded, color: AppConfig.accentColor, size: 16), SizedBox(width: 3), Text('320', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600))]),
          ),
        ],
      ),
    );
  }

  Widget _buildLastTraining() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [Icon(Icons.history_rounded, color: AppConfig.primaryColor, size: 20), SizedBox(width: 7), Text('上次训练', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))]),
          const SizedBox(height: 10),
          Text(_lastTraining!, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('继续上次的练习，保持稳定进步', style: TextStyle(color: Colors.black54, fontSize: 13)),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(onPressed: () => _openTraining(_lastTraining!), icon: const Icon(Icons.play_arrow_rounded), label: const Text('继续训练'))),
        ]),
      ),
    );
  }

  Widget _buildProjectSection() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(padding: EdgeInsets.only(top: 22, bottom: 10), child: Text('选择训练项目', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
      const Text('从一个你最想提升的场景开始', style: TextStyle(color: Colors.black54, fontSize: 13)),
      const SizedBox(height: 12),
      ..._projects.map((project) => _buildProjectCard(
            project.$1,
            project.$2,
            project.$3,
            project.$4,
            _selectedProject != null && _selectedProject != project.$1,
          )),
    ]);
  }

  Widget _buildProjectCard(String title, String subtitle, IconData icon,
      Color color, bool locked) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => _openTraining(title),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(width: 46, height: 46, decoration: BoxDecoration(color: locked ? Colors.grey.shade200 : color, borderRadius: BorderRadius.circular(13)), child: Icon(locked ? Icons.lock_outline_rounded : icon, color: locked ? Colors.grey : AppConfig.primaryColor, size: 25)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: locked ? Colors.black54 : Colors.black87)), const SizedBox(height: 4), Text(locked ? '需积分或时空穿梭券解锁' : subtitle, style: const TextStyle(color: Colors.black54, fontSize: 12))])),
            Icon(locked ? Icons.lock_rounded : Icons.chevron_right_rounded, color: locked ? Colors.grey : Colors.black38),
          ]),
        ),
      ),
    );
  }
}
