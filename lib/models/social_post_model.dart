import 'package:json_annotation/json_annotation.dart';

part 'social_post_model.g.dart';

/// 朋友圈动态数据模型
/// 对应数据库 social_posts 表
/// AI教练每日自动生成1条朋友圈
@JsonSerializable()
class SocialPostModel {
  final String id;
  final String coachId; // 教练ID（教练的朋友圈）
  final String content; // 动态内容
  final String postType; // 类型：life/mood/encouragement
  final List<String>? images; // 图片列表
  final int likeCount; // 点赞数
  final List<PostComment> comments; // 评论列表
  final DateTime createdAt;

  SocialPostModel({
    required this.id,
    required this.coachId,
    required this.content,
    required this.postType,
    this.images,
    this.likeCount = 0,
    this.comments = const [],
    required this.createdAt,
  });

  factory SocialPostModel.fromJson(Map<String, dynamic> json) =>
      _$SocialPostModelFromJson(json);
  Map<String, dynamic> toJson() => _$SocialPostModelToJson(this);
}

/// 朋友圈评论
@JsonSerializable()
class PostComment {
  final String id;
  final String userId;
  final String? userNickname;
  final String content;
  final DateTime createdAt;

  PostComment({
    required this.id,
    required this.userId,
    this.userNickname,
    required this.content,
    required this.createdAt,
  });

  factory PostComment.fromJson(Map<String, dynamic> json) =>
      _$PostCommentFromJson(json);
  Map<String, dynamic> toJson() => _$PostCommentToJson(this);
}
