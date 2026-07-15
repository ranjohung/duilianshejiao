import 'package:json_annotation/json_annotation.dart';

part 'membership_model.g.dart';

/// 会员方案定义
class MembershipPlan {
  final String level;
  final String label;
  final double price;
  final int duration; // 天数，0表示永久
  final MembershipFeatures features;

  const MembershipPlan({
    required this.level,
    required this.label,
    required this.price,
    required this.duration,
    required this.features,
  });

  /// 6级会员方案静态列表
  static const List<MembershipPlan> allPlans = [
    MembershipPlan(
      level: 'experience',
      label: '体验版',
      price: 0,
      duration: 0,
      features: MembershipFeatures(
        llmEngine: 'deepseek',
        weeklyTrainings: 1,
        renderType: '2d',
        voiceTraining: false,
        highDifficulty: false,
        weeklyShuttles: 0,
        weeklyDoublePoints: 0,
      ),
    ),
    MembershipPlan(
      level: 'free',
      label: '免费版',
      price: 0,
      duration: 0,
      features: MembershipFeatures(
        llmEngine: 'ollama',
        weeklyTrainings: 15,
        renderType: '2d',
        voiceTraining: false,
        highDifficulty: false,
        weeklyShuttles: 0,
        weeklyDoublePoints: 0,
      ),
    ),
    MembershipPlan(
      level: 'daily',
      label: '日卡',
      price: 3.9,
      duration: 1,
      features: MembershipFeatures(
        llmEngine: 'deepseek',
        weeklyTrainings: 20,
        renderType: '2d',
        voiceTraining: false,
        highDifficulty: false,
        weeklyShuttles: 0,
        weeklyDoublePoints: 0,
      ),
    ),
    MembershipPlan(
      level: 'weekly',
      label: '周卡',
      price: 18.0,
      duration: 7,
      features: MembershipFeatures(
        llmEngine: 'deepseek',
        weeklyTrainings: -1, // 无限
        renderType: '2.5d',
        voiceTraining: true,
        highDifficulty: true,
        weeklyShuttles: 3,
        weeklyDoublePoints: 1,
      ),
    ),
    MembershipPlan(
      level: 'monthly',
      label: '月卡',
      price: 58.0,
      duration: 30,
      features: MembershipFeatures(
        llmEngine: 'deepseek',
        weeklyTrainings: -1,
        renderType: '3d',
        voiceTraining: true,
        highDifficulty: true,
        weeklyShuttles: 10,
        weeklyDoublePoints: 3,
      ),
    ),
    MembershipPlan(
      level: 'yearly',
      label: '年卡',
      price: 398.0,
      duration: 365,
      features: MembershipFeatures(
        llmEngine: 'deepseek_high',
        weeklyTrainings: -1,
        renderType: '3d_plus',
        voiceTraining: true,
        highDifficulty: true,
        weeklyShuttles: 15,
        weeklyDoublePoints: 3,
      ),
    ),
  ];

  /// 根据level查找方案
  static MembershipPlan? findByLevel(String level) {
    for (final plan in allPlans) {
      if (plan.level == level) return plan;
    }
    return null;
  }

  /// 价格显示文本
  String get priceText {
    if (price == 0) return '免费';
    if (duration == 1) return '¥$price/日';
    if (duration == 7) return '¥${price.toInt()}/周';
    if (duration == 30) return '¥${price.toInt()}/月';
    if (duration == 365) return '¥${price.toInt()}/年';
    return '¥$price';
  }
}

/// 会员权益特性
class MembershipFeatures {
  final String llmEngine;
  final int weeklyTrainings; // -1表示无限
  final String renderType;
  final bool voiceTraining;
  final bool highDifficulty;
  final int weeklyShuttles;
  final int weeklyDoublePoints;

  const MembershipFeatures({
    required this.llmEngine,
    required this.weeklyTrainings,
    required this.renderType,
    required this.voiceTraining,
    required this.highDifficulty,
    required this.weeklyShuttles,
    required this.weeklyDoublePoints,
  });

  /// 每周训练次数显示文本
  String get weeklyTrainingsText {
    if (weeklyTrainings == -1) return '无限';
    return '$weeklyTrainings次';
  }
}

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

  /// 对应的会员方案
  MembershipPlan? get plan => MembershipPlan.findByLevel(level);

  factory MembershipModel.fromJson(Map<String, dynamic> json) =>
      _$MembershipModelFromJson(json);
  Map<String, dynamic> toJson() => _$MembershipModelToJson(this);
}

/// 会员权益对比行数据
class MembershipComparisonRow {
  final String feature;
  final List<String> values; // 6个值对应6种方案

  const MembershipComparisonRow({required this.feature, required this.values});
}

/// 会员权益对比表
class MembershipComparison {
  static const List<String> headers = ['权益', '体验', '免费', '日卡', '周卡', '月卡', '年卡'];

  static const List<MembershipComparisonRow> rows = [
    MembershipComparisonRow(feature: 'LLM引擎', values: ['DeepSeek(1次)', 'Ollama+10%偶遇', 'DeepSeek', 'DeepSeek', 'DeepSeek', 'DeepSeek高优']),
    MembershipComparisonRow(feature: '每周训练', values: ['1次', '15次', '20次', '无限', '无限', '无限']),
    MembershipComparisonRow(feature: '教练渲染', values: ['2D', '2D', '2D', '2.5D', '3D', '3D+真人']),
    MembershipComparisonRow(feature: '语音训练', values: ['❌', '❌', '❌', '✅', '✅', '✅']),
    MembershipComparisonRow(feature: '高难度关卡', values: ['❌', '❌', '❌', '✅', '✅', '✅']),
    MembershipComparisonRow(feature: '穿梭券', values: ['0', '签到获取', '签到获取', '3张/周', '10张/月', '15张/月']),
    MembershipComparisonRow(feature: '双倍积分卡', values: ['0', '签到获取', '签到获取', '1张/周', '3张/月', '3张/月']),
    MembershipComparisonRow(feature: '价格', values: ['免费', '免费', '¥3.9/日', '¥18/周', '¥58/月', '¥398/年']),
  ];
}
