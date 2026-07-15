import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/check_in_model.dart';

/// 签到服务
class CheckInService {
  final _client = ApiClient.instance;

  /// 每日签到
  /// 签到获得1张时空穿梭券，连签7天额外奖励
  Future<ApiResponse<CheckInModel>> checkIn() async {
    final res = await _client.post(ApiRoutes.checkIn);
    return ApiResponse.fromJson(res.data, (d) => CheckInModel.fromJson(d));
  }

  /// 获取签到状态（返回结构化 CheckInStatus）
  Future<ApiResponse<CheckInStatus>> getCheckInStatus() async {
    final res = await _client.get(ApiRoutes.checkInStatus);
    return ApiResponse.fromJson(
      res.data,
      (d) => CheckInStatus.fromJson(d as Map<String, dynamic>),
    );
  }
}
