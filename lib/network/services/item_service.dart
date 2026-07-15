import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/item_model.dart';

/// 道具服务
/// 道具类型：time_shuttle(时空穿梭券)/hint_card(提示卡)/emotion_shield(情绪护盾)/double_points(双倍积分卡)
class ItemService {
  final _client = ApiClient.instance;

  /// 获取用户道具列表
  Future<ApiResponse<List<ItemModel>>> getItems() async {
    final res = await _client.get(ApiRoutes.itemList);
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => ItemModel.fromJson(e)).toList(),
    );
  }

  /// 使用道具
  Future<ApiResponse> useItem({
    required String itemType,
    required String trainingId,
  }) async {
    final res = await _client.post(
      ApiRoutes.itemUse,
      data: {'itemType': itemType, 'trainingId': trainingId},
    );
    return ApiResponse.fromJson(res.data, null);
  }
}
