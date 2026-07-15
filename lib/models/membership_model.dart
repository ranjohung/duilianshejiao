import 'package:json_annotation/json_annotation.dart';

part 'membership_model.g.dart';

/// 会员数据模型
/// 对应数据库 memberships 表
/// 等级体系：experience(体验) / free(免费) / daily(日卡) / weekly(周卡) / monthly(月卡) / yearly(年卡)
@JsonSerializable()
class MembershipModel {
  final String id;
  final String userId;
  final String level; // experience/free/daily/weekly/monthly/yearly
  final DateTime? expireAt; // 到期时间
  final int remainingDailyUses; // 今日剩余训练次数
  final bool autoRenew; // 是否自动续费
  final DateTime createdAt;

  MembershipModel({
    required this.id,
    required this.userId,
    this.level = 'free',
    this.expireAt,
    this.remainingDailyUses = 15,
    this.autoRenew = false,
    required this.createdAt,
  });

  /// 是否已过期
  bool get isExpired => expireAt != null && DateTime.now().isAfter(expireAt!);

  /// 是否有效会员
  bool get isActive => !isExpired && level != 'free' && level != 'experience';

  /// 会员等级显示名
  String get levelDisplayName {
    const map = {
      'experience': '体验版',
      'free': '免费版',
      'daily': '日卡',
      'weekly': '周卡',
      'monthly': '月卡',
      'yearly': '年卡',
    };
    return map[level] ?? '免费版';
  }

  /// 教练渲染等级
  String get renderLevel {
    if (level == 'yearly') return '3d_real';
    if (level == 'monthly') return '3d';
    if (level == 'weekly') return 'live2d';
    return 'spine2d';
  }

  factory MembershipModel.fromJson(Map<String, dynamic> json) =>
      _$MembershipModelFromJson(json);
  Map<String, dynamic> toJson() => _$MembershipModelToJson(this);
}
