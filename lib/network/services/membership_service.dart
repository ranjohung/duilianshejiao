import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/membership_model.dart';

/// 会员服务
/// 等级体系：experience(体验3.9元日卡) / free / daily / weekly / monthly / yearly
class MembershipService {
  final _client = ApiClient.instance;

  /// 获取会员方案列表
  Future<ApiResponse<List<Map<String, dynamic>>>> getPlans() async {
    final res = await _client.get(ApiRoutes.membershipPlans);
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => e as Map<String, dynamic>).toList(),
    );
  }

  /// 获取当前会员状态
  Future<ApiResponse<Map<String, dynamic>>> getStatus() async {
    final res = await _client.get(ApiRoutes.membershipStatus);
    return ApiResponse.fromJson(
      res.data,
      (d) => d as Map<String, dynamic>,
    );
  }

  /// 购买会员
  Future<ApiResponse<Map<String, dynamic>>> purchase({
    required String level,
    required String paymentMethod,
  }) async {
    final res = await _client.post(
      ApiRoutes.membershipPurchase,
      data: {'level': level, 'paymentMethod': paymentMethod},
    );
    return ApiResponse.fromJson(res.data, (d) => d as Map<String, dynamic>);
  }

  /// 获取会员权益对比表
  Future<ApiResponse<Map<String, dynamic>>> getComparison() async {
    final res = await _client.get(ApiRoutes.membershipComparison);
    return ApiResponse.fromJson(
      res.data,
      (d) => d as Map<String, dynamic>,
    );
  }
}
