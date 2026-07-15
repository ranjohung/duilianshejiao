import 'package:json_annotation/json_annotation.dart';

part 'learning_card_model.g.dart';

/// 学习卡片数据模型
/// 对应数据库 learning_cards 表
@JsonSerializable()
class LearningCardModel {
  final String id;
  final String userId;
  final String? trainingRecordId; // 关联训练记录ID
  final String title; // 卡片标题
  final String content; // 卡片内容
  final String keyPoint; // 关键知识点
  final String? improvement; // 改进建议
  final bool isCollected; // 是否已收藏
  final DateTime createdAt;

  LearningCardModel({
    required this.id,
    required this.userId,
    this.trainingRecordId,
    required this.title,
    required this.content,
    required this.keyPoint,
    this.improvement,
    this.isCollected = false,
    required this.createdAt,
  });

  factory LearningCardModel.fromJson(Map<String, dynamic> json) =>
      _$LearningCardModelFromJson(json);
  Map<String, dynamic> toJson() => _$LearningCardModelToJson(this);
}
