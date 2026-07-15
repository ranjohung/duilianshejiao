import 'package:json_annotation/json_annotation.dart';

part 'item_model.g.dart';

/// 道具类型枚举
enum ItemType {
  timeShuttle,
  hintCard,
  shieldCard,
  doublePoints,
}

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

  // ============ 道具类型映射 ============

  /// 道具类型名称映射
  static const Map<ItemType, String> itemNames = {
    ItemType.timeShuttle: '时空穿梭券',
    ItemType.hintCard: '提示卡',
    ItemType.shieldCard: '护盾卡',
    ItemType.doublePoints: '双倍积分卡',
  };

  /// 道具类型图标映射
  static const Map<ItemType, String> itemIcons = {
    ItemType.timeShuttle: '⏳',
    ItemType.hintCard: '💡',
    ItemType.shieldCard: '🛡️',
    ItemType.doublePoints: '✨',
  };

  /// 道具类型描述
  static const Map<ItemType, String> itemDescriptions = {
    ItemType.timeShuttle: '训练中回退到上一轮对话',
    ItemType.hintCard: '训练中获取教练的对话提示',
    ItemType.shieldCard: '训练中抵消一次负面评分',
    ItemType.doublePoints: '本次训练获得双倍积分',
  };

  /// 字符串类型转枚举
  static ItemType? parseItemType(String type) {
    const map = {
      'time_shuttle': ItemType.timeShuttle,
      'hint_card': ItemType.hintCard,
      'emotion_shield': ItemType.shieldCard,
      'double_points': ItemType.doublePoints,
    };
    return map[type];
  }

  /// 枚举转字符串类型
  static String itemTypeToString(ItemType type) {
    const map = {
      ItemType.timeShuttle: 'time_shuttle',
      ItemType.hintCard: 'hint_card',
      ItemType.shieldCard: 'emotion_shield',
      ItemType.doublePoints: 'double_points',
    };
    return map[type] ?? 'time_shuttle';
  }

  /// 道具类型显示名
  String get itemTypeDisplayName {
    final enumType = parseItemType(itemType);
    if (enumType != null) return itemNames[enumType] ?? '未知道具';
    // 兜底旧映射
    const map = {
      'time_shuttle': '时空穿梭券',
      'hint_card': '提示卡',
      'emotion_shield': '护盾卡',
      'double_points': '双倍积分卡',
    };
    return map[itemType] ?? '未知道具';
  }

  /// 道具图标
  String get itemIcon {
    final enumType = parseItemType(itemType);
    if (enumType != null) return itemIcons[enumType] ?? '📦';
    const map = {
      'time_shuttle': '⏳',
      'hint_card': '💡',
      'emotion_shield': '🛡️',
      'double_points': '✨',
    };
    return map[itemType] ?? '📦';
  }

  /// 道具描述
  String get itemDescription {
    final enumType = parseItemType(itemType);
    if (enumType != null) return itemDescriptions[enumType] ?? '';
    return '';
  }

  factory ItemModel.fromJson(Map<String, dynamic> json) =>
      _$ItemModelFromJson(json);
  Map<String, dynamic> toJson() => _$ItemModelToJson(this);
}
