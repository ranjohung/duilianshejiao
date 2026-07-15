import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../constants/scene_constants.dart';
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
  String _selectedStage = ''; // 空字符串=全部，否则为阶段名

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
      // 将阶段名转为 stage 数字
      int? stageNum;
      if (_selectedStage.isNotEmpty) {
        final idx = SceneStages.all.indexOf(_selectedStage);
        if (idx >= 0) stageNum = idx + 1;
      }
      final result = await _sceneService.getSceneList(stage: stageNum);
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

  /// 顶部6大阶段横向滚动Chips
  Widget _buildStageFilter() {
    final stages = ['全部', ...SceneStages.all];
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: stages.map((label) {
          final isAll = label == '全部';
          final selected =
              isAll ? _selectedStage.isEmpty : _selectedStage == label;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: ChoiceChip(
              label: Text(label),
              selected: selected,
              onSelected: (_) {
                setState(() => _selectedStage = isAll ? '' : label);
                _loadScenes();
              },
              selectedColor: AppConfig.primaryColor.withOpacity(0.2),
            ),
          );
        }).toList(),
      ),
    );
  }

  /// 本地兜底场景数据（6个MVP场景）
  List<_LocalScene> get _localScenes => [
        _LocalScene(
          name: '初次见面',
          desc: '学会在陌生场合自然打招呼',
          stage: SceneStages.breakingIce,
          difficulty: 1,
          icon: Icons.waving_hand,
          estimatedDuration: 5,
          completionRate: 0.8,
          isLocked: false,
          unlockHint: '',
        ),
        _LocalScene(
          name: '兴趣破冰',
          desc: '找到共同话题，打开话匣子',
          stage: SceneStages.breakingIce,
          difficulty: 1,
          icon: Icons.favorite_border,
          estimatedDuration: 8,
          completionRate: 0.5,
          isLocked: false,
          unlockHint: '',
        ),
        _LocalScene(
          name: '同事闲聊',
          desc: '在茶水间自然地聊天',
          stage: SceneStages.contact,
          difficulty: 2,
          icon: Icons.coffee,
          estimatedDuration: 10,
          completionRate: 0.0,
          isLocked: false,
          unlockHint: '',
        ),
        _LocalScene(
          name: '深度倾诉',
          desc: '与好友分享内心感受',
          stage: SceneStages.familiar,
          difficulty: 2,
          icon: Icons.chat,
          estimatedDuration: 15,
          completionRate: 0.0,
          isLocked: true,
          unlockHint: '积分≥50',
        ),
        _LocalScene(
          name: '团队演讲',
          desc: '在众人面前自信表达',
          stage: SceneStages.workplace,
          difficulty: 3,
          icon: Icons.mic,
          estimatedDuration: 20,
          completionRate: 0.0,
          isLocked: true,
          unlockHint: '积分≥100',
        ),
        _LocalScene(
          name: '冲突化解',
          desc: '化解激烈冲突，达成共识',
          stage: SceneStages.advanced,
          difficulty: 3,
          icon: Icons.handshake,
          estimatedDuration: 25,
          completionRate: 0.0,
          isLocked: true,
          unlockHint: '积分≥300',
        ),
      ];

  /// 本地兜底场景列表（按选中阶段过滤）
  Widget _buildLocalScenes() {
    final filtered = _selectedStage.isEmpty
        ? _localScenes
        : _localScenes.where((s) => s.stage == _selectedStage).toList();
    if (filtered.isEmpty) {
      return Center(
        child: Text('该阶段暂无场景', style: TextStyle(color: Colors.grey[500])),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) => _buildLocalSceneCard(filtered[index]),
    );
  }

  Widget _buildLocalSceneCard(_LocalScene scene) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 第一行：图标+名称+阶段标签
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: scene.isLocked
                        ? Colors.grey[200]
                        : AppConfig.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    scene.isLocked ? Icons.lock_outline : scene.icon,
                    color:
                        scene.isLocked ? Colors.grey : AppConfig.primaryColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        scene.name,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: scene.isLocked ? Colors.grey : Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: AppConfig.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(scene.stage,
                                style: TextStyle(
                                    fontSize: 9,
                                    color: AppConfig.primaryColor)),
                          ),
                          const SizedBox(width: 8),
                          Text('⭐' * scene.difficulty,
                              style: const TextStyle(fontSize: 10)),
                          const SizedBox(width: 8),
                          Text('约${scene.estimatedDuration}分钟',
                              style: TextStyle(
                                  fontSize: 10, color: Colors.grey[500])),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // 描述
            Text(scene.desc,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
            const SizedBox(height: 8),
            // 完成度进度条
            Row(
              children: [
                Text('完成度',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                const SizedBox(width: 6),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: scene.completionRate,
                      backgroundColor: Colors.grey[200],
                      valueColor: AlwaysStoppedAnimation<Color>(
                        scene.completionRate >= 1.0
                            ? AppConfig.successColor
                            : AppConfig.primaryColor,
                      ),
                      minHeight: 6,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text('${(scene.completionRate * 100).toInt()}%',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
            const SizedBox(height: 10),
            // 开始训练按钮
            SizedBox(
              width: double.infinity,
              height: 36,
              child: ElevatedButton(
                onPressed:
                    scene.isLocked ? null : () => _onLocalSceneTap(scene),
                style: ElevatedButton.styleFrom(
                  backgroundColor: scene.isLocked
                      ? Colors.grey[300]
                      : AppConfig.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                child: scene.isLocked
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.lock, size: 14),
                          const SizedBox(width: 4),
                          Text('解锁条件：${scene.unlockHint}',
                              style: const TextStyle(fontSize: 12)),
                        ],
                      )
                    : const Text('开始训练', style: TextStyle(fontSize: 13)),
              ),
            ),
          ],
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
    final locked = scene.isLocked;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 第一行：图标+名称+阶段标签
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: locked
                        ? Colors.grey[200]
                        : AppConfig.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    locked ? Icons.lock_outline : Icons.theater_comedy,
                    color: locked ? Colors.grey : AppConfig.primaryColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        scene.name,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: locked ? Colors.grey : Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: AppConfig.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(scene.stageDisplayName,
                                style: TextStyle(
                                    fontSize: 9,
                                    color: AppConfig.primaryColor)),
                          ),
                          const SizedBox(width: 8),
                          Text(scene.difficultyText,
                              style: const TextStyle(fontSize: 10)),
                          const SizedBox(width: 8),
                          Text('约${scene.estimatedDuration}分钟',
                              style: TextStyle(
                                  fontSize: 10, color: Colors.grey[500])),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // 描述
            Text(
              scene.description ?? scene.teachingPoint,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            // 完成度进度条
            Row(
              children: [
                Text('完成度',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                const SizedBox(width: 6),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: scene.completionRate,
                      backgroundColor: Colors.grey[200],
                      valueColor: AlwaysStoppedAnimation<Color>(
                        scene.completionRate >= 1.0
                            ? AppConfig.successColor
                            : AppConfig.primaryColor,
                      ),
                      minHeight: 6,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text('${(scene.completionRate * 100).toInt()}%',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
            const SizedBox(height: 10),
            // 开始训练按钮
            SizedBox(
              width: double.infinity,
              height: 36,
              child: ElevatedButton(
                onPressed: locked ? null : () => _onSceneTap(scene),
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      locked ? Colors.grey[300] : AppConfig.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                child: locked
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.lock, size: 14),
                          const SizedBox(width: 4),
                          Text('解锁条件：${scene.unlockDescription}',
                              style: const TextStyle(fontSize: 12)),
                        ],
                      )
                    : const Text('开始训练', style: TextStyle(fontSize: 13)),
              ),
            ),
          ],
        ),
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
  final int estimatedDuration;
  final double completionRate;
  final bool isLocked;
  final String unlockHint;

  const _LocalScene({
    required this.name,
    required this.desc,
    required this.stage,
    required this.difficulty,
    required this.icon,
    required this.estimatedDuration,
    required this.completionRate,
    required this.isLocked,
    required this.unlockHint,
  });
}
