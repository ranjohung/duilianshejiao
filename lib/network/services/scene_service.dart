import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/scene_model.dart';

/// 场景服务
class SceneService {
  final _client = ApiClient.instance;

  /// 获取场景列表（含解锁状态）
  Future<ApiResponse<List<SceneModel>>> getSceneList({
    int? stage,
    bool? isHighChallenge,
  }) async {
    final res = await _client.get(
      ApiRoutes.sceneList,
      queryParameters: {
        if (stage != null) 'stage': stage,
        if (isHighChallenge != null) 'isHighChallenge': isHighChallenge,
      },
    );
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => SceneModel.fromJson(e)).toList(),
    );
  }

  /// 获取场景详情
  Future<ApiResponse<SceneModel>> getSceneDetail({
    required String sceneId,
  }) async {
    final res = await _client.get('${ApiRoutes.sceneDetail}/$sceneId');
    return ApiResponse.fromJson(res.data, (d) => SceneModel.fromJson(d));
  }

  /// 开始训练
  Future<ApiResponse> startTraining({
    required String sceneId,
    required String coachId,
    String mode = 'text',
  }) async {
    final res = await _client.post(
      '${ApiRoutes.sceneStart}/$sceneId/start',
      data: {'coachId': coachId, 'mode': mode},
    );
    return ApiResponse.fromJson(res.data, null);
  }

  /// 完成训练（提交评估）
  Future<ApiResponse> completeTraining({
    required String sceneId,
    required String trainingId,
    required double score,
    required int starRating,
    required List<Map<String, dynamic>> qualityMarks,
  }) async {
    final res = await _client.post(
      '${ApiRoutes.sceneComplete}/$sceneId/complete',
      data: {
        'trainingId': trainingId,
        'score': score,
        'starRating': starRating,
        'qualityMarks': qualityMarks,
      },
    );
    return ApiResponse.fromJson(res.data, null);
  }
}
