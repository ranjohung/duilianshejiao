// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'goodnight_plan_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

GoodnightPlanModel _$GoodnightPlanModelFromJson(Map<String, dynamic> json) =>
    GoodnightPlanModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      coachId: json['coachId'] as String,
      scheduledTime: DateTime.parse(json['scheduledTime'] as String),
      content: json['content'] as String?,
      audioUrl: json['audioUrl'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$GoodnightPlanModelToJson(GoodnightPlanModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'coachId': instance.coachId,
      'scheduledTime': instance.scheduledTime.toIso8601String(),
      'content': instance.content,
      'audioUrl': instance.audioUrl,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt.toIso8601String(),
    };
