import 'package:json_annotation/json_annotation.dart';

part 'scene_model.g.dart';

@JsonSerializable()
class SceneModel {
  final String id;
  final String name;
  final String stage;
  final String difficulty;
  final String description;
  final int rounds;
  final String npcName;
  final String npcAvatar;
  final String opening;
  final bool isLocked;
  final String? stageDisplayName;
  final String? difficultyText;
  final int estimatedDuration;
  final String? teachingPoint;
  final double completionRate;
  final String? unlockDescription;
  final bool isUnlocked;
  final String? unlockReason;
  final bool? completed;

  SceneModel({
    required this.id,
    required this.name,
    required this.stage,
    required this.difficulty,
    required this.description,
    required this.rounds,
    required this.npcName,
    required this.npcAvatar,
    required this.opening,
    this.isLocked = false,
    this.stageDisplayName,
    this.difficultyText,
    this.estimatedDuration = 5,
    this.teachingPoint,
    this.completionRate = 0,
    this.unlockDescription,
    this.isUnlocked = true,
    this.unlockReason,
    this.completed,
  });

  String get stageDisplay => stageDisplayName ?? stage;
  String get difficultyDisplay => difficultyText ?? difficulty;
  String get descriptionOrTeaching => description;

  factory SceneModel.fromJson(Map<String, dynamic> json) =>
      _$SceneModelFromJson(json);
  Map<String, dynamic> toJson() => _$SceneModelToJson(this);
}

/// 场景列表按阶段分组后的接口返回模型。
class StageGroup {
  final String stage;
  final bool unlocked;
  final List<SceneModel> scenes;

  const StageGroup({
    required this.stage,
    required this.unlocked,
    required this.scenes,
  });

  factory StageGroup.fromJson(Map<String, dynamic> json) {
    final rawScenes = (json['scenes'] as List<dynamic>?) ?? const [];
    return StageGroup(
      stage: json['stage'] as String? ?? '',
      unlocked: json['unlocked'] as bool? ?? false,
      scenes: rawScenes
          .whereType<Map<String, dynamic>>()
          .map(SceneModel.fromJson)
          .toList(),
    );
  }
}
