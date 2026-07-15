import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

/// 用户数据模型
/// 对应数据库 users 表
@JsonSerializable()
class UserModel {
  final String id;
  final String? phone;
  final String nickname;
  final String? avatar;
  final int? gender; // 0未知 1男 2女
  final int? age;
  final String memberLevel; // 会员等级：experience/free/daily/weekly/monthly/yearly
  final int trainingPoints; // 训练积分
  final int totalTrainingDays; // 累计训练天数
  final int totalTrainingCount; // 累计训练次数
  final int comprehensiveScore; // 综合得分
  final int sceneCount; // 已完成场景数
  final bool isRealNameVerified; // 是否已实名认证
  final String? studentLevel; // 学员等级：bronze/silver/gold/platinum/diamond/master
  final String? currentCoachId; // 当前教练ID
  final DateTime createdAt;
  final DateTime updatedAt;

  UserModel({
    required this.id,
    this.phone,
    required this.nickname,
    this.avatar,
    this.gender,
    this.age,
    this.memberLevel = 'free',
    this.trainingPoints = 0,
    this.totalTrainingDays = 0,
    this.totalTrainingCount = 0,
    this.comprehensiveScore = 0,
    this.sceneCount = 0,
    this.isRealNameVerified = false,
    this.studentLevel = 'bronze',
    this.currentCoachId,
    required this.createdAt,
    required this.updatedAt,
  });

  /// 是否免费用户
  bool get isFreeUser => memberLevel == 'free' || memberLevel == 'experience';

  /// 是否付费会员
  bool get isPaidMember => !isFreeUser;

  /// 每周训练次数上限
  int get weeklyTrainingLimit {
    switch (memberLevel) {
      case 'free':
      case 'experience':
        return 15;
      case 'daily':
        return 20;
      default:
        return -1; // 无限制
    }
  }

  /// 学员等级显示名
  String get studentLevelDisplayName {
    const map = {
      'bronze': '青铜学员',
      'silver': '白银学员',
      'gold': '黄金学员',
      'platinum': '铂金学员',
      'diamond': '钻石学员',
      'master': '大师学员',
    };
    return map[studentLevel] ?? '青铜学员';
  }

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserModelToJson(this);
}
