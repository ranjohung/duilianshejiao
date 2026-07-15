import 'package:json_annotation/json_annotation.dart';

part 'check_in_model.g.dart';

/// 签到数据模型
/// 对应数据库 check_ins 表
@JsonSerializable()
class CheckInModel {
  final String id;
  final String userId;
  final DateTime checkInDate; // 签到日期
  final int consecutiveDays; // 连续签到天数
  final String rewardType; // 奖励类型：time_shuttle/item/exp
  final int rewardAmount; // 奖励数量
  final DateTime createdAt;

  /// 连续签到天数（别名，与 consecutiveDays 一致）
  final int streakDays;

  /// 本次签到获得积分
  final int pointsEarned;

  /// 今日是否已签到
  final bool todayCheckedIn;

  CheckInModel({
    required this.id,
    required this.userId,
    required this.checkInDate,
    this.consecutiveDays = 1,
    this.rewardType = 'time_shuttle',
    this.rewardAmount = 1,
    required this.createdAt,
    this.streakDays = 1,
    this.pointsEarned = 0,
    this.todayCheckedIn = false,
  });

  /// 是否连签7天（额外奖励）
  bool get isWeeklyBonus => consecutiveDays > 0 && consecutiveDays % 7 == 0;

  factory CheckInModel.fromJson(Map<String, dynamic> json) =>
      _$CheckInModelFromJson(json);
  Map<String, dynamic> toJson() => _$CheckInModelToJson(this);
}

/// 签到状态（用于首页快速展示）
class CheckInStatus {
  final bool todayCheckedIn;
  final int streakDays;
  final int pointsEarned;
  final String? nextRewardType;
  final int nextRewardAmount;

  CheckInStatus({
    this.todayCheckedIn = false,
    this.streakDays = 0,
    this.pointsEarned = 0,
    this.nextRewardType,
    this.nextRewardAmount = 1,
  });

  factory CheckInStatus.fromJson(Map<String, dynamic> json) {
    return CheckInStatus(
      todayCheckedIn: json['todayCheckedIn'] as bool? ?? false,
      streakDays: json['streakDays'] as int? ?? 0,
      pointsEarned: json['pointsEarned'] as int? ?? 0,
      nextRewardType: json['nextRewardType'] as String?,
      nextRewardAmount: json['nextRewardAmount'] as int? ?? 1,
    );
  }
}
