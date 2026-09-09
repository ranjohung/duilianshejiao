// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'growth_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

GrowthModel _$GrowthModelFromJson(Map<String, dynamic> json) => GrowthModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      communicationScore: (json['communicationScore'] as num?)?.toDouble() ?? 0,
      expressionScore: (json['expressionScore'] as num?)?.toDouble() ?? 0,
      empathyScore: (json['empathyScore'] as num?)?.toDouble() ?? 0,
      emotionControlScore:
          (json['emotionControlScore'] as num?)?.toDouble() ?? 0,
      adaptabilityScore: (json['adaptabilityScore'] as num?)?.toDouble() ?? 0,
      comprehensiveScore: (json['comprehensiveScore'] as num?)?.toDouble() ?? 0,
      milestones: (json['milestones'] as List<dynamic>?)
              ?.map((e) => Milestone.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      weeklyProgress: (json['weeklyProgress'] as List<dynamic>?)
              ?.map((e) => (e as num).toDouble())
              .toList() ??
          const [],
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$GrowthModelToJson(GrowthModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'communicationScore': instance.communicationScore,
      'expressionScore': instance.expressionScore,
      'empathyScore': instance.empathyScore,
      'emotionControlScore': instance.emotionControlScore,
      'adaptabilityScore': instance.adaptabilityScore,
      'comprehensiveScore': instance.comprehensiveScore,
      'milestones': instance.milestones,
      'weeklyProgress': instance.weeklyProgress,
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

Milestone _$MilestoneFromJson(Map<String, dynamic> json) => Milestone(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
      achievedAt: DateTime.parse(json['achievedAt'] as String),
    );

Map<String, dynamic> _$MilestoneToJson(Milestone instance) => <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'icon': instance.icon,
      'achievedAt': instance.achievedAt.toIso8601String(),
    };
