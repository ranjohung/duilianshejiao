import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/scene_model.dart';
import '../../models/coach_model.dart';
import '../../network/services/scene_service.dart';
import '../../network/services/coach_service.dart';
import '../../widgets/common_widgets.dart';
import '../training/training_page.dart';

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
  List<_StageGroup> _stageGroups = [];
  bool _isLoading = true;
  String? _error;

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
      final result = await _sceneService.getGroupedScenes();
      if (result.isSuccess && result.data != null) {
        setState(() {
          _stageGroups = result.data!;
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
      body: _isLoading
          ? loadingWidget()
          : _error != null
              ? errorWidget(message: _error!, onRetry: _loadScenes)
              : _buildStageGroups(),
    );
  }

  Widget _buildStageGroups() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 16),
      itemCount: _stageGroups.length,
      itemBuilder: (context, index) => _buildStageSection(_stageGroups[index]),
    );
  }

  Widget _buildStageSection(_StageGroup group) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(
                group.unlocked ? Icons.lock_open_outlined : Icons.lock_outlined,
                size: 16,
                color: group.unlocked ? widget.coachColor : Colors.grey[400],
              ),
              const SizedBox(width: 8),
              Text(
                group.stage,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: group.unlocked ? Colors.black : Colors.grey[400],
                ),
              ),
              if (!group.unlocked)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Text(
                    '需完成上一阶段',
                    style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                  ),
                ),
            ],
          ),
        ),
        if (group.unlocked)
          _buildSceneList(group.scenes)
        else
          _buildLockedStage(),
      ],
    );
  }

  Widget _buildLockedStage() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[100]),
      ),
      child: const Center(
        child: Column(
          children: [
            Icon(Icons.lock_outline, size: 32, color: Colors.grey[300]),
            SizedBox(height: 8),
            Text(
              '该阶段尚未解锁',
              style: TextStyle(fontSize: 14, color: Colors.grey[400]),
            ),
            SizedBox(height: 4),
            Text(
              '完成上一阶段的场景以解锁',
              style: TextStyle(fontSize: 12, color: Colors.grey[400]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSceneList(List<SceneModel> scenes) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: scenes.map((scene) => _buildSceneCard(scene)).toList(),
      ),
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
            color: unlocked
                ? widget.coachColor.withOpacity(0.1)
                : Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Stack(
            children: [
              Icon(
                unlocked ? Icons.theater_comedy : Icons.lock_outline,
                color: unlocked ? widget.coachColor : Colors.grey,
                size: 24,
              ),
              if (scene.completed == true)
                Positioned(
                  bottom: -2,
                  right: -2,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(Icons.check, size: 12, color: Colors.white),
                  ),
                ),
            ],
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
              scene.description ?? scene.teachingPoint ?? '',
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
                  child: Text(scene.stageDisplay,
                      style: TextStyle(
                          fontSize: 10, color: AppConfig.primaryColor)),
                ),
                const SizedBox(width: 8),
                Text(scene.difficultyDisplay,
                    style: const TextStyle(fontSize: 10)),
                const SizedBox(width: 8),
                Text('${scene.rounds}轮',
                    style: TextStyle(fontSize: 10, color: Colors.grey[500])),
              ],
            ),
            if (!unlocked && scene.unlockReason != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  scene.unlockReason!,
                  style: TextStyle(fontSize: 11, color: Colors.orange[600]),
                ),
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
      final coachResult =
          await _coachService.getCoachDetail(coachId: widget.coachId!);
      if (coachResult.isSuccess && coachResult.data != null) {
        if (mounted) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  TrainingPage(coach: coachResult.data!, scene: scene),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('加载教练数据失败: $e')));
      }
    }
  }
}

class _StageGroup {
  final String stage;
  final bool unlocked;
  final List<SceneModel> scenes;

  _StageGroup({
    required this.stage,
    required this.unlocked,
    required this.scenes,
  });

  factory _StageGroup.fromJson(Map<String, dynamic> json) {
    final scenes = (json['scenes'] as List<dynamic>?) ?? [];
    return _StageGroup(
      stage: json['stage'] as String,
      unlocked: json['unlocked'] as bool,
      scenes: scenes.map((e) => SceneModel.fromJson(e)).toList(),
    );
  }
}