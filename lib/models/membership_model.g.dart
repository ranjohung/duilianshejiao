// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'membership_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MembershipModel _$MembershipModelFromJson(Map<String, dynamic> json) =>
    MembershipModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      level: json['level'] as String? ?? 'free',
      expireAt: json['expireAt'] == null
          ? null
          : DateTime.parse(json['expireAt'] as String),
      remainingDailyUses: (json['remainingDailyUses'] as num?)?.toInt() ?? 15,
      autoRenew: json['autoRenew'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$MembershipModelToJson(MembershipModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'level': instance.level,
      'expireAt': instance.expireAt?.toIso8601String(),
      'remainingDailyUses': instance.remainingDailyUses,
      'autoRenew': instance.autoRenew,
      'createdAt': instance.createdAt.toIso8601String(),
    };
