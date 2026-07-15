import 'package:json_annotation/json_annotation.dart';

part 'scene_model.g.dart';

/// 场景数据模型
/// 对应数据库 scenes 表
@JsonSerializable()
class SceneModel {
  final String id;
  final String name;
  final String? description;
  final String? coverImage;
  final int stage; // 社交阶段：1破冰期/2接触期/3熟悉期/4-6后续
  final int difficulty; // 难度星级 1-4
  final int rounds; // 对话轮次
  final String teachingPoint; // 教学点
  final UnlockCondition? unlockCondition; // 解锁条件
  final int estimatedDuration; // 预计时长（分钟）
  final bool isHighChallenge; // 是否高难度关卡
  final String? category; // 分类标签
  final bool isUnlocked; // 当前用户是否已解锁
  final bool isCompleted; // 当前用户是否已完成
  final int? starRating; // 当前用户通关星级 0-3
  final DateTime createdAt;

  SceneModel({
    required this.id,
    required this.name,
    this.description,
    this.coverImage,
    required this.stage,
    this.difficulty = 1,
    this.rounds = 3,
    required this.teachingPoint,
    this.unlockCondition,
    this.estimatedDuration = 10,
    this.isHighChallenge = false,
    this.category,
    this.isUnlocked = false,
    this.isCompleted = false,
    this.starRating,
    required this.createdAt,
  });

  /// 阶段显示名
  String get stageDisplayName {
    const map = {1: '破冰期', 2: '接触期', 3: '熟悉期', 4: '深化期', 5: '升华期', 6: '成熟期'};
    return map[stage] ?? '未知阶段';
  }

  /// 难度星级文字
  String get difficultyText => '⭐' * difficulty;

  /// 是否三星通关
  bool get isThreeStar => starRating == 3;

  factory SceneModel.fromJson(Map<String, dynamic> json) =>
      _$SceneModelFromJson(json);
  Map<String, dynamic> toJson() => _$SceneModelToJson(this);
}

/// 解锁条件
@JsonSerializable()
class UnlockCondition {
  final int? minTrainingPoints; // 最低训练积分
  final int? requiredStageCompleted; // 需完成阶段
  final String? requiredSceneId; // 需完成的前置场景ID

  UnlockCondition({
    this.minTrainingPoints,
    this.requiredStageCompleted,
    this.requiredSceneId,
  });

  factory UnlockCondition.fromJson(Map<String, dynamic> json) =>
      _$UnlockConditionFromJson(json);
  Map<String, dynamic> toJson() => _$UnlockConditionToJson(this);
}
