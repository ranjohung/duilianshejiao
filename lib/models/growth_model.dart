import 'package:json_annotation/json_annotation.dart';

part 'growth_model.g.dart';

/// 成长数据模型
/// 对应数据库 growth_profiles 表
@JsonSerializable()
class GrowthModel {
  final String id;
  final String userId;
  final double communicationScore; // 沟通力 0-100
  final double expressionScore;    // 表达力 0-100
  final double empathyScore;       // 共情力 0-100
  final double emotionControlScore; // 情绪控制 0-100
  final double adaptabilityScore;  // 应变力 0-100
  final double comprehensiveScore; // 综合得分 0-100
  final List<Milestone> milestones; // 里程碑列表
  final List<double> weeklyProgress; // 近7天进步数据
  final DateTime updatedAt;

  GrowthModel({
    required this.id,
    required this.userId,
    this.communicationScore = 0,
    this.expressionScore = 0,
    this.empathyScore = 0,
    this.emotionControlScore = 0,
    this.adaptabilityScore = 0,
    this.comprehensiveScore = 0,
    this.milestones = const [],
    this.weeklyProgress = const [],
    required this.updatedAt,
  });

  /// 五维度得分列表（用于雷达图）
  List<double> get radarValues => [
    communicationScore,
    expressionScore,
    empathyScore,
    emotionControlScore,
    adaptabilityScore,
  ];

  /// 雷达图维度标签
  static const List<String> radarLabels = ['沟通力', '表达力', '共情力', '情绪控制', '应变力'];

  factory GrowthModel.fromJson(Map<String, dynamic> json) =>
      _$GrowthModelFromJson(json);
  Map<String, dynamic> toJson() => _$GrowthModelToJson(this);
}

/// 里程碑
@JsonSerializable()
class Milestone {
  final String id;
  final String title;
  final String? description;
  final String? icon;
  final DateTime achievedAt;

  Milestone({
    required this.id,
    required this.title,
    this.description,
    this.icon,
    required this.achievedAt,
  });

  factory Milestone.fromJson(Map<String, dynamic> json) =>
      _$MilestoneFromJson(json);
  Map<String, dynamic> toJson() => _$MilestoneToJson(this);
}
