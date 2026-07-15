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

  CheckInModel({
    required this.id,
    required this.userId,
    required this.checkInDate,
    this.consecutiveDays = 1,
    this.rewardType = 'time_shuttle',
    this.rewardAmount = 1,
    required this.createdAt,
  });

  /// 是否连签7天（额外奖励）
  bool get isWeeklyBonus => consecutiveDays > 0 && consecutiveDays % 7 == 0;

  factory CheckInModel.fromJson(Map<String, dynamic> json) =>
      _$CheckInModelFromJson(json);
  Map<String, dynamic> toJson() => _$CheckInModelToJson(this);
}
