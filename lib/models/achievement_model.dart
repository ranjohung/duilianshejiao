import 'package:json_annotation/json_annotation.dart';

part 'achievement_model.g.dart';

/// 成就数据模型
/// 对应数据库 achievements 表
@JsonSerializable()
class AchievementModel {
  final String id;
  final String userId;
  final String type; // 成就类型：training/checkin/social/challenge/growth
  final String title; // 成就标题
  final String description; // 成就描述
  final String? icon; // 成就图标
  final DateTime? unlockedAt; // 解锁时间

  AchievementModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.description,
    this.icon,
    this.unlockedAt,
  });

  /// 是否已解锁
  bool get isUnlocked => unlockedAt != null;

  factory AchievementModel.fromJson(Map<String, dynamic> json) =>
      _$AchievementModelFromJson(json);
  Map<String, dynamic> toJson() => _$AchievementModelToJson(this);
}
