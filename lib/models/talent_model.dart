import 'package:json_annotation/json_annotation.dart';

part 'talent_model.g.dart';

/// 才艺数据模型
/// 对应数据库 talents 表
/// 才艺类型：speech(演讲)/writing(写作)/negotiation(谈判)/humor(幽默)/empathy(共情)
@JsonSerializable()
class TalentModel {
  final String id;
  final String userId;
  final String talentType; // 才艺类型
  final int level; // 等级 1-6
  final int experience; // 经验值
  final DateTime createdAt;

  TalentModel({
    required this.id,
    required this.userId,
    required this.talentType,
    this.level = 1,
    this.experience = 0,
    required this.createdAt,
  });

  /// 才艺类型显示名
  String get talentTypeDisplayName {
    const map = {
      'speech': '演讲',
      'writing': '写作',
      'negotiation': '谈判',
      'humor': '幽默',
      'empathy': '共情',
    };
    return map[talentType] ?? '未知';
  }

  /// 升级所需经验值
  int get expToNextLevel => level * 100;

  /// 经验进度百分比
  double get progress => experience / expToNextLevel;

  factory TalentModel.fromJson(Map<String, dynamic> json) =>
      _$TalentModelFromJson(json);
  Map<String, dynamic> toJson() => _$TalentModelToJson(this);
}
