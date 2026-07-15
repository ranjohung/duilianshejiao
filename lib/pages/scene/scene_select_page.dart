import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/scene_model.dart';
import '../../models/coach_model.dart';
import '../../network/services/scene_service.dart';
import '../../network/services/coach_service.dart';
import '../../widgets/common_widgets.dart';
import '../training/training_page.dart';

/// 场景选择页面
/// 从教练详情页进入，选择场景后跳转训练页面
class SceneSelectPage extends StatefulWidget {
  final String? coachId;
  final String coachName;
  final Color coachColor;

  const SceneSelectPage({
    super.key,
    this.coachId,
    required this.coachName,
    required this.coachColor,
  });

  @override
  State<SceneSelectPage> createState() => _SceneSelectPageState();
}

class _SceneSelectPageState extends State<SceneSelectPage> {
  final _sceneService = SceneService();
  final _coachService = CoachService();
  List<SceneModel> _scenes = [];
  bool _isLoading = true;
  String? _error;
  int _selectedStage = 0; // 0=全部

  @override
  void initState() {
    super.initState();
    _loadScenes();
  }

  Future<void> _loadScenes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final result = await _sceneService.getSceneList(
        stage: _selectedStage > 0 ? _selectedStage : null,
      );
      if (result.isSuccess && result.data != null) {
        setState(() {
          _scenes = result.data!;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = result.message.isNotEmpty ? result.message : '加载场景失败';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('选择场景 · ${widget.coachName}'),
        backgroundColor: widget.coachColor,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // 阶段筛选
          _buildStageFilter(),
          // 场景列表
          Expanded(
            child: _isLoading
                ? loadingWidget()
                : _error != null
                    ? errorWidget(message: _error!, onRetry: _loadScenes)
                    : _scenes.isEmpty
                        ? _buildLocalScenes()
                        : _buildSceneList(_scenes),
          ),
        ],
      ),
    );
  }

  Widget _buildStageFilter() {
    final stages = [
      {'label': '全部', 'value': 0},
      {'label': '破冰期', 'value': 1},
      {'label': '接触期', 'value': 2},
      {'label': '熟悉期', 'value': 3},
      {'label': '深化期', 'value': 4},
    ];
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: stages.map((s) {
          final selected = _selectedStage == s['value'];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: ChoiceChip(
              label: Text(s['label'] as String),
              selected: selected,
              onSelected: (_) {
                setState(() => _selectedStage = s['value'] as int);
                _loadScenes();
              },
              selectedColor: widget.coachColor.withOpacity(0.2),
            ),
          );
        }).toList(),
      ),
    );
  }

  /// 本地兜底场景数据
  Widget _buildLocalScenes() {
    final localScenes = [
      _LocalSceneData(name: '初次见面', desc: '学会在陌生场合自然打招呼', stage: '破冰期', difficulty: 1, icon: Icons.waving_hand),
      _LocalSceneData(name: '兴趣破冰', desc: '找到共同话题，打开话匣子', stage: '破冰期', difficulty: 1, icon: Icons.favorite_border),
      _LocalSceneData(name: '同事闲聊', desc: '在茶水间自然地聊天', stage: '接触期', difficulty: 2, icon: Icons.coffee),
      _LocalSceneData(name: '朋友聚会', desc: '在多人场合中自如交流', stage: '接触期', difficulty: 2, icon: Icons.groups),
      _LocalSceneData(name: '深度倾诉', desc: '与好友分享内心感受', stage: '熟悉期', difficulty: 3, icon: Icons.chat),
      _LocalSceneData(name: '团队演讲', desc: '在众人面前自信表达', stage: '深化期', difficulty: 4, icon: Icons.mic),
    ];
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: localScenes.length,
      itemBuilder: (context, index) => _buildLocalSceneCard(localScenes[index]),
    );
  }

  Widget _buildLocalSceneCard(_LocalSceneData scene) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: widget.coachColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(scene.icon, color: widget.coachColor),
        ),
        title: Text(scene.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(scene.desc, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppConfig.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(scene.stage, style: TextStyle(fontSize: 10, color: AppConfig.primaryColor)),
                ),
                const SizedBox(width: 8),
                Text('⭐' * scene.difficulty, style: const TextStyle(fontSize: 10)),
              ],
            ),
          ],
        ),
        trailing: Icon(Icons.arrow_forward_ios, size: 16, color: widget.coachColor),
        onTap: () => _onLocalSceneTap(scene),
      ),
    );
  }

  Widget _buildSceneList(List<SceneModel> scenes) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: scenes.length,
      itemBuilder: (context, index) => _buildSceneCard(scenes[index]),
    );
  }

  Widget _buildSceneCard(SceneModel scene) {
    final unlocked = scene.isUnlocked;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: unlocked ? widget.coachColor.withOpacity(0.1) : Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            unlocked ? Icons.theater_comedy : Icons.lock_outline,
            color: unlocked ? widget.coachColor : Colors.grey,
          ),
        ),
        title: Text(
          scene.name,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: unlocked ? Colors.black : Colors.grey,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              scene.description ?? scene.teachingPoint,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppConfig.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(scene.stageDisplayName, style: TextStyle(fontSize: 10, color: AppConfig.primaryColor)),
                ),
                const SizedBox(width: 8),
                Text(scene.difficultyText, style: const TextStyle(fontSize: 10)),
                const SizedBox(width: 8),
                Text('${scene.rounds}轮 · ${scene.estimatedDuration}分钟', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
              ],
            ),
          ],
        ),
        trailing: Icon(
          unlocked ? Icons.arrow_forward_ios : Icons.lock,
          size: 16,
          color: unlocked ? widget.coachColor : Colors.grey,
        ),
        onTap: unlocked ? () => _onSceneTap(scene) : null,
      ),
    );
  }

  void _onSceneTap(SceneModel scene) async {
    if (widget.coachId == null) return;
    try {
      final coachResult = await _coachService.getCoachDetail(coachId: widget.coachId!);
      if (coachResult.isSuccess && coachResult.data != null) {
        if (mounted) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => TrainingPage(coach: coachResult.data!, scene: scene),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('加载教练数据失败: $e')));
      }
    }
  }

  void _onLocalSceneTap(_LocalSceneData scene) {
    // 本地兜底：创建临时CoachModel和SceneModel
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('请先连接后端服务以开始训练')),
    );
  }
}

class _LocalSceneData {
  final String name;
  final String desc;
  final String stage;
  final int difficulty;
  final IconData icon;

  const _LocalSceneData({
    required this.name,
    required this.desc,
    required this.stage,
    required this.difficulty,
    required this.icon,
  });
}
