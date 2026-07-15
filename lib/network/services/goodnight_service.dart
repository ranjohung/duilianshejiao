import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/goodnight_plan_model.dart';

/// 晚安计划服务
class GoodnightService {
  final _client = ApiClient.instance;

  /// 获取晚安计划
  Future<ApiResponse<GoodnightPlanModel>> getPlan() async {
    final res = await _client.get(ApiRoutes.goodnightPlan);
    return ApiResponse.fromJson(
      res.data,
      (d) => GoodnightPlanModel.fromJson(d),
    );
  }

  /// 设置晚安计划
  Future<ApiResponse<GoodnightPlanModel>> setPlan({
    required String coachId,
    required String pushTime,
    bool enabled = true,
  }) async {
    final res = await _client.post(
      ApiRoutes.goodnightPlan,
      data: {
        'coachId': coachId,
        'pushTime': pushTime,
        'enabled': enabled,
      },
    );
    return ApiResponse.fromJson(
      res.data,
      (d) => GoodnightPlanModel.fromJson(d),
    );
  }

  /// 更新晚安计划
  Future<ApiResponse<GoodnightPlanModel>> updatePlan({
    String? coachId,
    String? pushTime,
    bool? enabled,
  }) async {
    final data = <String, dynamic>{};
    if (coachId != null) data['coachId'] = coachId;
    if (pushTime != null) data['pushTime'] = pushTime;
    if (enabled != null) data['enabled'] = enabled;
    final res = await _client.put(
      ApiRoutes.goodnightPlan,
      data: data,
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
