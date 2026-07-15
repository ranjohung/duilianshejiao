import 'package:json_annotation/json_annotation.dart';

part 'goodnight_plan_model.g.dart';

/// 晚安计划数据模型
/// 对应数据库 goodnight_plans 表
@JsonSerializable()
class GoodnightPlanModel {
  final String id;
  final String userId;
  final String coachId; // 教练ID
  final DateTime scheduledTime; // 计划推送时间（每晚9-10点）
  final String? content; // 晚安内容
  final String? audioUrl; // 语音地址
  final bool isActive; // 是否启用
  final DateTime createdAt;

  GoodnightPlanModel({
    required this.id,
    required this.userId,
    required this.coachId,
    required this.scheduledTime,
    this.content,
    this.audioUrl,
    this.isActive = true,
    required this.createdAt,
  });

  factory GoodnightPlanModel.fromJson(Map<String, dynamic> json) =>
      _$GoodnightPlanModelFromJson(json);
  Map<String, dynamic> toJson() => _$GoodnightPlanModelToJson(this);
}
