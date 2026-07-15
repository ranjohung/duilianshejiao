import 'package:json_annotation/json_annotation.dart';

part 'item_model.g.dart';

/// 道具数据模型
/// 对应数据库 items 表
/// 道具类型：time_shuttle(时空穿梭券)/hint_card(提示卡)/emotion_shield(情绪护盾)/double_points(双倍积分卡)
@JsonSerializable()
class ItemModel {
  final String id;
  final String userId;
  final String itemType; // 道具类型
  final int quantity; // 数量
  final DateTime createdAt;

  ItemModel({
    required this.id,
    required this.userId,
    required this.itemType,
    this.quantity = 0,
    required this.createdAt,
  });

  /// 道具类型显示名
  String get itemTypeDisplayName {
    const map = {
      'time_shuttle': '时空穿梭券',
      'hint_card': '提示卡',
      'emotion_shield': '情绪护盾',
      'double_points': '双倍积分卡',
    };
    return map[itemType] ?? '未知道具';
  }

  /// 道具图标
  String get itemIcon {
    const map = {
      'time_shuttle': '🕐',
      'hint_card': '💡',
      'emotion_shield': '🛡️',
      'double_points': '✨',
    };
    return map[itemType] ?? '📦';
  }

  factory ItemModel.fromJson(Map<String, dynamic> json) =>
      _$ItemModelFromJson(json);
  Map<String, dynamic> toJson() => _$ItemModelToJson(this);
}
