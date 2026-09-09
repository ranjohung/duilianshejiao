import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../config/api_config.dart';
import '../../demo/demo_data.dart';
import '../../models/scene_model.dart';

/// 场景服务
class SceneService {
  final _client = ApiClient.instance;

  /// 获取场景列表（含解锁状态）
  Future<ApiResponse<List<SceneModel>>> getSceneList({
    int? stage,
    bool? isHighChallenge,
  }) async {
    if (ApiConfig.demoMode) {
      final data = stage == null
          ? DemoData.scenes
          : DemoData.scenes
              .where((scene) => scene.stage == _stageName(stage))
              .toList();
      return ApiResponse(code: 0, message: 'demo', data: data);
    }
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

  /// 按阶段分组获取场景列表
  Future<ApiResponse<List<StageGroup>>> getGroupedScenes() async {
    if (ApiConfig.demoMode) {
      return ApiResponse(code: 0, message: 'demo', data: DemoData.groupedScenes);
    }
    final res = await _client.get(ApiRoutes.sceneGrouped);
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => StageGroup.fromJson(e)).toList(),
    );
  }

  /// 按阶段获取场景列表
  Future<ApiResponse<List<SceneModel>>> getScenesByStage({
    required int stage,
  }) async {
    if (ApiConfig.demoMode) {
      final data = DemoData.scenes
          .where((scene) => scene.stage == _stageName(stage))
          .toList();
      return ApiResponse(code: 0, message: 'demo', data: data);
    }
    final res = await _client.get(
      ApiRoutes.sceneList,
      queryParameters: {'stage': stage},
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
    if (ApiConfig.demoMode) {
      final scene = DemoData.scenes.firstWhere(
        (item) => item.id == sceneId,
        orElse: () => DemoData.scenes.first,
      );
      return ApiResponse(code: 0, message: 'demo', data: scene);
    }
    final res = await _client.get('${ApiRoutes.sceneDetail}/$sceneId');
    return ApiResponse.fromJson(res.data, (d) => SceneModel.fromJson(d));
  }

  /// 检查场景是否解锁
  Future<ApiResponse<Map<String, dynamic>>> checkUnlock({
    required String sceneId,
  }) async {
    if (ApiConfig.demoMode) {
      return ApiResponse(code: 0, message: 'demo', data: {'unlocked': true});
    }
    final res = await _client.get(
      '${ApiRoutes.sceneDetail}/$sceneId/check-unlock',
    );
    return ApiResponse.fromJson(
      res.data,
      (d) => d as Map<String, dynamic>,
    );
  }

  /// 开始训练
  Future<ApiResponse> startTraining({
    required String sceneId,
    required String coachId,
    String mode = 'text',
  }) async {
    if (ApiConfig.demoMode) {
      return ApiResponse(code: 0, message: 'demo', data: {'sessionId': 'demo-session'});
    }
    final res = await _client.post(
      '${ApiRoutes.sceneDetail}/$sceneId/start',
      data: {'coachId': coachId, 'mode': mode},
    );
    return ApiResponse.fromJson(res.data, null);
  }

  /// 完成训练（提交评估）
  Future<ApiResponse> completeTraining({
    required String sceneId,
    required String sessionId,
    required double score,
    required int starRating,
    required List<Map<String, dynamic>> qualityMarks,
  }) async {
    if (ApiConfig.demoMode) {
      return ApiResponse(code: 0, message: 'demo', data: const {});
    }
    final res = await _client.post(
      ApiRoutes.trainingEnd,
      data: {
        'sessionId': sessionId,
        'score': score,
        'starRating': starRating,
        'qualityMarks': qualityMarks,
      },
    );
    return ApiResponse.fromJson(res.data, null);
  }

  String _stageName(int stage) {
    const names = ['破冰入门', '日常沟通', '职场表达'];
    return stage > 0 && stage <= names.length ? names[stage - 1] : '';
  }
}
