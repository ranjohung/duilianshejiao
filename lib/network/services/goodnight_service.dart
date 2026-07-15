import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/goodnight_plan_model.dart';

/// 晚安计划服务
class GoodnightService {
  final _client = ApiClient.instance;

  /// 设置晚安计划
  Future<ApiResponse<GoodnightPlanModel>> setPlan({
    required String coachId,
    required DateTime scheduledTime,
  }) async {
    final res = await _client.post(
      ApiRoutes.goodnightPlan,
      data: {
        'coachId': coachId,
        'scheduledTime': scheduledTime.toIso8601String(),
      },
    );
    return ApiResponse.fromJson(
      res.data,
      (d) => GoodnightPlanModel.fromJson(d),
    );
  }

  /// 触发晚安推送（每晚9-10点由定时任务调用）
  Future<ApiResponse> trigger({required String userId}) async {
    final res = await _client.post(
      ApiRoutes.goodnightTrigger,
      data: {'userId': userId},
    );
    return ApiResponse.fromJson(res.data, null);
  }
}
