// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'training_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TrainingModel _$TrainingModelFromJson(Map<String, dynamic> json) =>
    TrainingModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      sceneId: json['sceneId'] as String,
      coachId: json['coachId'] as String,
      score: (json['score'] as num?)?.toDouble() ?? 0,
      starRating: (json['starRating'] as num?)?.toInt() ?? 0,
      qualityMarks: (json['qualityMarks'] as List<dynamic>?)
              ?.map((e) => QualityMark.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      emotionDiary: json['emotionDiary'] as String?,
      evaluationReport: json['evaluationReport'] == null
          ? null
          : EvaluationReport.fromJson(
              json['evaluationReport'] as Map<String, dynamic>),
      mode: json['mode'] as String? ?? 'text',
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      chatMessages: (json['chatMessages'] as List<dynamic>?)
          ?.map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
      startedAt: DateTime.parse(json['startedAt'] as String),
      endedAt: json['endedAt'] == null
          ? null
          : DateTime.parse(json['endedAt'] as String),
    );

Map<String, dynamic> _$TrainingModelToJson(TrainingModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'sceneId': instance.sceneId,
      'coachId': instance.coachId,
      'score': instance.score,
      'starRating': instance.starRating,
      'qualityMarks': instance.qualityMarks,
      'emotionDiary': instance.emotionDiary,
      'evaluationReport': instance.evaluationReport,
      'mode': instance.mode,
      'duration': instance.duration,
      'chatMessages': instance.chatMessages,
      'startedAt': instance.startedAt.toIso8601String(),
      'endedAt': instance.endedAt?.toIso8601String(),
    };

QualityMark _$QualityMarkFromJson(Map<String, dynamic> json) => QualityMark(
      round: (json['round'] as num).toInt(),
      quality: json['quality'] as String,
      feedback: json['feedback'] as String?,
    );

Map<String, dynamic> _$QualityMarkToJson(QualityMark instance) =>
    <String, dynamic>{
      'round': instance.round,
      'quality': instance.quality,
      'feedback': instance.feedback,
    };

EvaluationReport _$EvaluationReportFromJson(Map<String, dynamic> json) =>
    EvaluationReport(
      overallScore: (json['overallScore'] as num).toDouble(),
      summary: json['summary'] as String?,
      strengths: (json['strengths'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      improvements: (json['improvements'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      dimensionScores: (json['dimensionScores'] as Map<String, dynamic>?)?.map(
            (k, e) => MapEntry(k, (e as num).toDouble()),
          ) ??
          const {},
    );

Map<String, dynamic> _$EvaluationReportToJson(EvaluationReport instance) =>
    <String, dynamic>{
      'overallScore': instance.overallScore,
      'summary': instance.summary,
      'strengths': instance.strengths,
      'improvements': instance.improvements,
      'dimensionScores': instance.dimensionScores,
    };

ChatMessage _$ChatMessageFromJson(Map<String, dynamic> json) => ChatMessage(
      role: json['role'] as String,
      content: json['content'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      audioUrl: json['audioUrl'] as String?,
    );

Map<String, dynamic> _$ChatMessageToJson(ChatMessage instance) =>
    <String, dynamic>{
      'role': instance.role,
      'content': instance.content,
      'timestamp': instance.timestamp.toIso8601String(),
      'audioUrl': instance.audioUrl,
    };
