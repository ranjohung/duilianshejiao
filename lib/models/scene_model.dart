import 'package:json_annotation/json_annotation.dart';
import '../constants/scene_constants.dart';

part 'scene_model.g.dart';

/// 场景数据模型
/// 对应数据库 scenes 表
@JsonSerializable()
class SceneModel {
  final String id;
  final String name;
  final String? description;
  final String? coverImage;
  final int stage; // 社交阶段：1破冰期/2接触期/3熟悉期/4亲密期/5职场期/6高难期
  final int difficulty; // 难度星级 1-3
  final int rounds; // 对话轮次
  final int totalRounds; // 总轮次
  final String teachingPoint; // 教学点
  final List<String> teachingPoints; // 教学点列表
  final UnlockCondition? unlockCondition; // 解锁条件
  final int estimatedDuration; // 预计时长（分钟）
  final bool isHighChallenge; // 是否高难度关卡
  final String? category; // 分类标签
  final bool isUnlocked; // 当前用户是否已解锁
  final bool isLocked; // 是否锁定
  final bool isCompleted; // 当前用户是否已完成
  final double completionRate; // 完成率 0.0-1.0
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
    this.totalRounds = 3,
    required this.teachingPoint,
    this.teachingPoints = const [],
    this.unlockCondition,
    this.estimatedDuration = 10,
    this.isHighChallenge = false,
    this.category,
    this.isUnlocked = false,
    this.isLocked = false,
    this.isCompleted = false,
    this.completionRate = 0.0,
    this.starRating,
    required this.createdAt,
  });

  /// 阶段显示名（6大社交阶段）
  String get stageDisplayName {
    const map = {
      1: '破冰期',
      2: '接触期',
      3: '熟悉期',
      4: '亲密期',
      5: '职场期',
      6: '高难期',
    };
    return map[stage] ?? '未知阶段';
  }

  /// 阶段对应 SceneStages 常量
  String get stageConstant {
    const map = {
      1: SceneStages.breakingIce,
      2: SceneStages.contact,
      3: SceneStages.familiar,
      4: SceneStages.intimate,
      5: SceneStages.workplace,
      6: SceneStages.advanced,
    };
    return map[stage] ?? '';
  }

  /// 难度星级文字
  String get difficultyText => '⭐' * difficulty;

  /// 是否三星通关
  bool get isThreeStar => starRating == 3;

  /// 解锁条件描述
  String get unlockDescription {
    if (!isLocked) return '';
    final parts = <String>[];
    if (unlockCondition != null) {
      if (unlockCondition!.minTrainingPoints != null &&
          unlockCondition!.minTrainingPoints! > 0) {
        parts.add('积分≥${unlockCondition!.minTrainingPoints}');
      }
      if (unlockCondition!.requiredStageCompleted != null &&
          unlockCondition!.requiredStageCompleted! > 0) {
        const stageNames = {
          1: '破冰期',
          2: '接触期',
          3: '熟悉期',
          4: '亲密期',
          5: '职场期',
          6: '高难期',
        };
        final name =
            stageNames[unlockCondition!.requiredStageCompleted!] ?? '前置阶段';
        parts.add('完成$name');
      }
    }
    // 若无显式条件则用阶段积分兜底
    if (parts.isEmpty) {
      final minPts = SceneUnlockRules.getMinPoints(stageDisplayName);
      if (minPts > 0) {
        parts.add('积分≥$minPts');
      }
    }
    return parts.isEmpty ? '未解锁' : parts.join('、');
  }

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
