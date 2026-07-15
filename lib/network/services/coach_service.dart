import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/coach_model.dart';

/// 教练服务
class CoachService {
  final _client = ApiClient.instance;

  /// 获取教练列表（含预设4个+自定义）
  Future<ApiResponse<List<CoachModel>>> getCoachList({
    String? teachingStyle,
  }) async {
    final res = await _client.get(
      ApiRoutes.coachList,
      queryParameters: {
        if (teachingStyle != null) 'teachingStyle': teachingStyle,
      },
    );
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => CoachModel.fromJson(e)).toList(),
    );
  }

  /// 获取教练详情
  Future<ApiResponse<CoachModel>> getCoachDetail({
    required String coachId,
  }) async {
    final res = await _client.get('${ApiRoutes.coachDetail}/$coachId');
    return ApiResponse.fromJson(res.data, (d) => CoachModel.fromJson(d));
  }

  /// 创建自定义教练
  Future<ApiResponse<CoachModel>> createCustomCoach({
    required String name,
    required String teachingStyle,
    required Map<String, dynamic> personalityConfig,
    String? voiceId,
    String? occupation,
    int? age,
  }) async {
    final res = await _client.post(
      ApiRoutes.coachCustom,
      data: {
        'name': name,
        'teachingStyle': teachingStyle,
        'personalityConfig': personalityConfig,
        if (voiceId != null) 'voiceId': voiceId,
        if (occupation != null) 'occupation': occupation,
        if (age != null) 'age': age,
      },
    );
    return ApiResponse.fromJson(res.data, (d) => CoachModel.fromJson(d));
  }

  /// 更新教练人格设置
  Future<ApiResponse<CoachModel>> updatePersonality({
    required String coachId,
    required Map<String, dynamic> personalityConfig,
    String? customizedName,
  }) async {
    final res = await _client.put(
      '${ApiRoutes.coachPersonality}/$coachId/personality',
      data: {
        'personalityConfig': personalityConfig,
        if (customizedName != null) 'customizedName': customizedName,
      },
    );
    return ApiResponse.fromJson(res.data, (d) => CoachModel.fromJson(d));
  }
}
