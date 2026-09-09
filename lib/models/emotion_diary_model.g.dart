// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'emotion_diary_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

EmotionDiaryModel _$EmotionDiaryModelFromJson(Map<String, dynamic> json) =>
    EmotionDiaryModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      trainingRecordId: json['trainingRecordId'] as String?,
      emotionType: json['emotionType'] as String,
      intensity: (json['intensity'] as num).toInt(),
      content: json['content'] as String,
      aiFeedback: json['aiFeedback'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$EmotionDiaryModelToJson(EmotionDiaryModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'trainingRecordId': instance.trainingRecordId,
      'emotionType': instance.emotionType,
      'intensity': instance.intensity,
      'content': instance.content,
      'aiFeedback': instance.aiFeedback,
      'createdAt': instance.createdAt.toIso8601String(),
    };
