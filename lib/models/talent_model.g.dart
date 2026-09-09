// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'talent_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TalentModel _$TalentModelFromJson(Map<String, dynamic> json) => TalentModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      talentType: json['talentType'] as String,
      level: (json['level'] as num?)?.toInt() ?? 1,
      experience: (json['experience'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$TalentModelToJson(TalentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'talentType': instance.talentType,
      'level': instance.level,
      'experience': instance.experience,
      'createdAt': instance.createdAt.toIso8601String(),
    };
