// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
      id: json['id'] as String,
      phone: json['phone'] as String?,
      nickname: json['nickname'] as String,
      avatar: json['avatar'] as String?,
      gender: (json['gender'] as num?)?.toInt(),
      age: (json['age'] as num?)?.toInt(),
      memberLevel: json['memberLevel'] as String? ?? 'free',
      trainingPoints: (json['trainingPoints'] as num?)?.toInt() ?? 0,
      totalTrainingDays: (json['totalTrainingDays'] as num?)?.toInt() ?? 0,
      totalTrainingCount: (json['totalTrainingCount'] as num?)?.toInt() ?? 0,
      comprehensiveScore: (json['comprehensiveScore'] as num?)?.toInt() ?? 0,
      sceneCount: (json['sceneCount'] as num?)?.toInt() ?? 0,
      isRealNameVerified: json['isRealNameVerified'] as bool? ?? false,
      studentLevel: json['studentLevel'] as String? ?? 'bronze',
      currentCoachId: json['currentCoachId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
      'id': instance.id,
      'phone': instance.phone,
      'nickname': instance.nickname,
      'avatar': instance.avatar,
      'gender': instance.gender,
      'age': instance.age,
      'memberLevel': instance.memberLevel,
      'trainingPoints': instance.trainingPoints,
      'totalTrainingDays': instance.totalTrainingDays,
      'totalTrainingCount': instance.totalTrainingCount,
      'comprehensiveScore': instance.comprehensiveScore,
      'sceneCount': instance.sceneCount,
      'isRealNameVerified': instance.isRealNameVerified,
      'studentLevel': instance.studentLevel,
      'currentCoachId': instance.currentCoachId,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
