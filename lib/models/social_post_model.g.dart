// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'social_post_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SocialPostModel _$SocialPostModelFromJson(Map<String, dynamic> json) =>
    SocialPostModel(
      id: json['id'] as String,
      coachId: json['coachId'] as String,
      content: json['content'] as String,
      postType: json['postType'] as String,
      images:
          (json['images'] as List<dynamic>?)?.map((e) => e as String).toList(),
      likeCount: (json['likeCount'] as num?)?.toInt() ?? 0,
      comments: (json['comments'] as List<dynamic>?)
              ?.map((e) => PostComment.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$SocialPostModelToJson(SocialPostModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'coachId': instance.coachId,
      'content': instance.content,
      'postType': instance.postType,
      'images': instance.images,
      'likeCount': instance.likeCount,
      'comments': instance.comments,
      'createdAt': instance.createdAt.toIso8601String(),
    };

PostComment _$PostCommentFromJson(Map<String, dynamic> json) => PostComment(
      id: json['id'] as String,
      userId: json['userId'] as String,
      userNickname: json['userNickname'] as String?,
      content: json['content'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$PostCommentToJson(PostComment instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'userNickname': instance.userNickname,
      'content': instance.content,
      'createdAt': instance.createdAt.toIso8601String(),
    };
