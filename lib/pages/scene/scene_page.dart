import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/scene_model.dart';
import '../../network/services/scene_service.dart';
import '../../widgets/common_widgets.dart';
import 'scene_select_page.dart';

/// Tab3 场景页
/// 展示场景分类列表，选择场景后跳转到教练选择→训练
class ScenePage extends StatefulWidget {
  const ScenePage({super.key});

  @override
  State<ScenePage> createState() => _ScenePageState();
}

class _ScenePageState extends State<ScenePage> {
  final _sceneService = SceneService();
  List<SceneModel> _scenes = [];
  bool _isLoading = true;
  String? _error;
  int _selectedStage = 0;

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
        title: const Text('场景'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          _buildStageFilter(),
          Expanded(
            child: _isLoading
                ? loadingWidget()
                : _error != null
                    ? errorWidget(message: _error!, onRetry: _loadScenes)
                    : _scenes.isEmpty
                        ? _buildLocalScenes()
                        : _buildSceneList(),
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
      {'label': '升华期', 'value': 5},
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
              selectedColor: AppConfig.primaryColor.withOpacity(0.2),
            ),
          );
        }).toList(),
      ),
    );
  }

  /// 本地兜底场景数据
  Widget _buildLocalScenes() {
    final localScenes = [
      _LocalScene(
          name: '初次见面',
          desc: '学会在陌生场合自然打招呼',
          stage: '破冰期',
          difficulty: 1,
          icon: Icons.waving_hand),
      _LocalScene(
          name: '兴趣破冰',
          desc: '找到共同话题，打开话匣子',
          stage: '破冰期',
          difficulty: 1,
          icon: Icons.favorite_border),
      _LocalScene(
          name: '同事闲聊',
          desc: '在茶水间自然地聊天',
          stage: '接触期',
          difficulty: 2,
          icon: Icons.coffee),
      _LocalScene(
          name: '朋友聚会',
          desc: '在多人场合中自如交流',
          stage: '接触期',
          difficulty: 2,
          icon: Icons.groups),
      _LocalScene(
          name: '深度倾诉',
          desc: '与好友分享内心感受',
          stage: '熟悉期',
          difficulty: 3,
          icon: Icons.chat),
      _LocalScene(
          name: '团队演讲',
          desc: '在众人面前自信表达',
          stage: '深化期',
          difficulty: 4,
          icon: Icons.mic),
    ];
    return GridView.count(
      crossAxisCount: 2,
      padding: const EdgeInsets.all(16),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 0.85,
      children: localScenes.map((s) => _buildLocalSceneCard(s)).toList(),
    );
  }

  Widget _buildLocalSceneCard(_LocalScene scene) {
    return GestureDetector(
      onTap: () => _onLocalSceneTap(scene),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 8)
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppConfig.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(scene.icon, color: AppConfig.primaryColor),
              ),
              const SizedBox(height: 10),
              Text(scene.name,
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center),
              const SizedBox(height: 4),
              Text(scene.desc,
                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                  maxLines: 2),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppConfig.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(scene.stage,
                        style: TextStyle(
                            fontSize: 9, color: AppConfig.primaryColor)),
                  ),
                  const SizedBox(width: 6),
                  Text('⭐' * scene.difficulty,
                      style: const TextStyle(fontSize: 9)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSceneList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _scenes.length,
      itemBuilder: (context, index) => _buildSceneCard(_scenes[index]),
    );
  }

  Widget _buildSceneCard(SceneModel scene) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: scene.isUnlocked
                ? AppConfig.primaryColor.withOpacity(0.1)
                : Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            scene.isUnlocked ? Icons.theater_comedy : Icons.lock_outline,
            color: scene.isUnlocked ? AppConfig.primaryColor : Colors.grey,
          ),
        ),
        title: Text(
          scene.name,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: scene.isUnlocked ? Colors.black : Colors.grey,
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppConfig.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(scene.stageDisplayName,
                      style: TextStyle(
                          fontSize: 10, color: AppConfig.primaryColor)),
                ),
                const SizedBox(width: 8),
                Text(scene.difficultyText,
                    style: const TextStyle(fontSize: 10)),
                const SizedBox(width: 8),
                Text('${scene.rounds}轮 · ${scene.estimatedDuration}分钟',
                    style: TextStyle(fontSize: 10, color: Colors.grey[500])),
              ],
            ),
          ],
        ),
        trailing: Icon(
          scene.isUnlocked ? Icons.arrow_forward_ios : Icons.lock,
          size: 16,
          color: scene.isUnlocked ? AppConfig.primaryColor : Colors.grey,
        ),
        onTap: scene.isUnlocked ? () => _onSceneTap(scene) : null,
      ),
    );
  }

  void _onSceneTap(SceneModel scene) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SceneSelectPage(
          coachName: '教练',
          coachColor: AppConfig.primaryColor,
        ),
      ),
    );
  }

  void _onLocalSceneTap(_LocalScene scene) {
    // 选择场景后跳转到教练选择
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const SceneSelectPage(
          coachName: '教练',
          coachColor: AppConfig.primaryColor,
        ),
      ),
    );
  }
}

class _LocalScene {
  final String name;
  final String desc;
  final String stage;
  final int difficulty;
  final IconData icon;

  const _LocalScene({
    required this.name,
    required this.desc,
    required this.stage,
    required this.difficulty,
    required this.icon,
  });
}
