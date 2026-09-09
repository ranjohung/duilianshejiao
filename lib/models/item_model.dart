/// 用户道具模型。
///
/// 道具接口来自 MySQL，id 可能是数字自增主键，也可能是历史字符串 ID，
/// 因此统一转换为字符串，避免不同环境 JSON 类型差异导致崩溃。
class ItemModel {
  final String id;
  final String itemType;
  final String name;
  final String description;
  final String icon;
  final int priceCoins;
  final int quantity;

  const ItemModel({
    required this.id,
    required this.itemType,
    required this.name,
    required this.description,
    required this.icon,
    this.priceCoins = 0,
    this.quantity = 0,
  });

  factory ItemModel.fromJson(Map<String, dynamic> json) {
    int asInt(dynamic value) =>
        value is num ? value.toInt() : int.tryParse('$value') ?? 0;
    final rawId = json['id'] ??
        json['itemId'] ??
        json['item_type'] ??
        json['itemType'] ??
        '';
    final rawType = json['itemType'] ?? json['item_type'] ?? rawId;
    return ItemModel(
      id: '$rawId',
      itemType: '$rawType',
      name: '${json['name'] ?? ''}',
      description: '${json['description'] ?? ''}',
      icon: '${json['icon'] ?? ''}',
      priceCoins: asInt(json['priceCoins'] ?? json['price_coins'] ?? json['price']),
      quantity: asInt(json['quantity']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'itemType': itemType,
        'name': name,
        'description': description,
        'icon': icon,
        'priceCoins': priceCoins,
        'quantity': quantity,
      };
}
