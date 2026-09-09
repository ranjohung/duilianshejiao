// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'learning_card_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LearningCardModel _$LearningCardModelFromJson(Map<String, dynamic> json) =>
    LearningCardModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      trainingRecordId: json['trainingRecordId'] as String?,
      title: json['title'] as String,
      content: json['content'] as String,
      keyPoint: json['keyPoint'] as String,
      improvement: json['improvement'] as String?,
      isCollected: json['isCollected'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$LearningCardModelToJson(LearningCardModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'trainingRecordId': instance.trainingRecordId,
      'title': instance.title,
      'content': instance.content,
      'keyPoint': instance.keyPoint,
      'improvement': instance.improvement,
      'isCollected': instance.isCollected,
      'createdAt': instance.createdAt.toIso8601String(),
    };
