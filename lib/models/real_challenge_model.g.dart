// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'real_challenge_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RealChallengeModel _$RealChallengeModelFromJson(Map<String, dynamic> json) =>
    RealChallengeModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      evidenceUrl: json['evidenceUrl'] as String?,
      status: json['status'] as String? ?? 'pending',
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$RealChallengeModelToJson(RealChallengeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'title': instance.title,
      'description': instance.description,
      'evidenceUrl': instance.evidenceUrl,
      'status': instance.status,
      'createdAt': instance.createdAt.toIso8601String(),
    };
