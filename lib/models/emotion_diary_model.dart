import 'package:json_annotation/json_annotation.dart';

part 'emotion_diary_model.g.dart';

/// 情绪日记数据模型
/// 对应数据库 emotion_diaries 表
@JsonSerializable()
class EmotionDiaryModel {
  final String id;
  final String userId;
  final String? trainingRecordId; // 关联训练记录ID
  final String emotionType; // 情绪类型：happy/calm/anxious/sad/angry
  final int intensity; // 强度 1-10
  final String content; // 日记内容
  final String? aiFeedback; // AI反馈
  final DateTime createdAt;

  EmotionDiaryModel({
    required this.id,
    required this.userId,
    this.trainingRecordId,
    required this.emotionType,
    required this.intensity,
    required this.content,
    this.aiFeedback,
    required this.createdAt,
  });

  /// 情绪类型显示名
  String get emotionTypeDisplayName {
    const map = {
      'happy': '开心',
      'calm': '平静',
      'anxious': '焦虑',
      'sad': '低落',
      'angry': '愤怒',
    };
    return map[emotionType] ?? '未知';
  }

  /// 是否需要心理三级响应
  bool get needsPsychologicalResponse => intensity >= 8;

  factory EmotionDiaryModel.fromJson(Map<String, dynamic> json) =>
      _$EmotionDiaryModelFromJson(json);
  Map<String, dynamic> toJson() => _$EmotionDiaryModelToJson(this);
}
