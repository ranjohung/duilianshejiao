import 'package:json_annotation/json_annotation.dart';

part 'training_model.g.dart';

/// 训练记录数据模型
/// 对应数据库 training_records 表
@JsonSerializable()
class TrainingModel {
  final String id;
  final String userId;
  final String sceneId;
  final String coachId;
  final double score; // 得分 0-100
  final int starRating; // 星级评分 0-3
  final List<QualityMark> qualityMarks; // 每轮对话质量标记
  final String? emotionDiary; // 情绪日记内容
  final EvaluationReport? evaluationReport; // 评估报告
  final String mode; // 训练模式：text/voice
  final int duration; // 训练时长（秒）
  final List<ChatMessage>? chatMessages; // 对话记录
  final DateTime startedAt;
  final DateTime? endedAt;

  TrainingModel({
    required this.id,
    required this.userId,
    required this.sceneId,
    required this.coachId,
    this.score = 0,
    this.starRating = 0,
    this.qualityMarks = const [],
    this.emotionDiary,
    this.evaluationReport,
    this.mode = 'text',
    this.duration = 0,
    this.chatMessages,
    required this.startedAt,
    this.endedAt,
  });

  /// 是否已完成
  bool get isCompleted => endedAt != null;

  /// 训练时长分钟
  int get durationInMinutes => duration ~/ 60;

  factory TrainingModel.fromJson(Map<String, dynamic> json) =>
      _$TrainingModelFromJson(json);
  Map<String, dynamic> toJson() => _$TrainingModelToJson(this);
}

/// 对话质量标记
@JsonSerializable()
class QualityMark {
  final int round; // 轮次
  final String quality; // 标记：excellent/good/average/poor
  final String? feedback; // 反馈说明

  QualityMark({
    required this.round,
    required this.quality,
    this.feedback,
  });

  factory QualityMark.fromJson(Map<String, dynamic> json) =>
      _$QualityMarkFromJson(json);
  Map<String, dynamic> toJson() => _$QualityMarkToJson(this);
}

/// 评估报告
@JsonSerializable()
class EvaluationReport {
  final double overallScore; // 总分
  final String? summary; // 总结
  final List<String> strengths; // 优点
  final List<String> improvements; // 改进建议
  final Map<String, double> dimensionScores; // 各维度得分

  EvaluationReport({
    required this.overallScore,
    this.summary,
    this.strengths = const [],
    this.improvements = const [],
    this.dimensionScores = const {},
  });

  factory EvaluationReport.fromJson(Map<String, dynamic> json) =>
      _$EvaluationReportFromJson(json);
  Map<String, dynamic> toJson() => _$EvaluationReportToJson(this);
}

/// 对话消息
@JsonSerializable()
class ChatMessage {
  final String role; // user/coach
  final String content;
  final DateTime timestamp;
  final String? audioUrl; // 语音地址（语音模式）

  ChatMessage({
    required this.role,
    required this.content,
    required this.timestamp,
    this.audioUrl,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageFromJson(json);
  Map<String, dynamic> toJson() => _$ChatMessageToJson(this);
}
