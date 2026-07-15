import 'package:json_annotation/json_annotation.dart';

part 'real_challenge_model.g.dart';

/// 真实挑战数据模型
/// 对应数据库 real_challenges 表
/// 线下真实社交任务，完成后上传凭证
@JsonSerializable()
class RealChallengeModel {
  final String id;
  final String userId;
  final String title; // 挑战标题
  final String? description; // 挑战描述
  final String? evidenceUrl; // 凭证地址（照片/截图）
  final String status; // 状态：pending/completed/verified/rejected
  final DateTime createdAt;

  RealChallengeModel({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.evidenceUrl,
    this.status = 'pending',
    required this.createdAt,
  });

  /// 是否已完成
  bool get isCompleted => status == 'completed' || status == 'verified';

  /// 状态显示名
  String get statusDisplayName {
    const map = {
      'pending': '待完成',
      'completed': '已完成',
      'verified': '已验证',
      'rejected': '被驳回',
    };
    return map[status] ?? '未知';
  }

  factory RealChallengeModel.fromJson(Map<String, dynamic> json) =>
      _$RealChallengeModelFromJson(json);
  Map<String, dynamic> toJson() => _$RealChallengeModelToJson(this);
}
