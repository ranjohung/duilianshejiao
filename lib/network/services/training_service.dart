import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../config/api_config.dart';
import '../../demo/demo_data.dart';
import '../../models/training_model.dart';

/// 训练服务
class TrainingService {
  final _client = ApiClient.instance;
  final Map<String, int> _demoRounds = <String, int>{};

  /// 开始训练
  Future<Map<String, dynamic>> startTraining({
    required String coachId,
    required String sceneId,
  }) async {
    if (ApiConfig.demoMode) {
      final result = DemoData.startTraining(sceneId);
      final sessionId = result['sessionId'] as String;
      _demoRounds[sessionId] = 1;
      return result;
    }
    final res = await _client.post(
      ApiRoutes.trainingStart,
      data: {
        'coachId': coachId,
        'sceneId': sceneId,
      },
    );
    final apiRes = ApiResponse.fromJson(
      res.data,
      (d) => d as Map<String, dynamic>,
    );
    if (apiRes.isSuccess && apiRes.data != null) {
      return apiRes.data!;
    }
    throw Exception(apiRes.message.isNotEmpty ? apiRes.message : '启动训练失败');
  }

  /// 发送对话消息（LLM路由）
  /// 后端根据会员等级自动路由到DeepSeek或Ollama
  Future<Map<String, dynamic>> sendMessage({
    required String sessionId,
    required String message,
    int? choiceIndex,
    String? audioUrl,
  }) async {
    if (ApiConfig.demoMode) {
      final round = _demoRounds[sessionId] ?? 1;
      final result = DemoData.sendMessage(round: round, message: message);
      if (result['isFinished'] == true) {
        _demoRounds.remove(sessionId);
      } else {
        _demoRounds[sessionId] = (result['currentRound'] as int?) ?? round + 1;
      }
      return result;
    }
    final res = await _client.post(
      ApiRoutes.trainingMessage,
      data: {
        'sessionId': sessionId,
        'message': message,
        if (choiceIndex != null) 'choiceIndex': choiceIndex,
        if (audioUrl != null) 'audioUrl': audioUrl,
      },
    );
    final apiRes = ApiResponse.fromJson(
      res.data,
      (d) => d as Map<String, dynamic>,
    );
    if (apiRes.isSuccess && apiRes.data != null) {
      return apiRes.data!;
    }
    throw Exception(apiRes.message.isNotEmpty ? apiRes.message : '发送消息失败');
  }

  /// SSE流式发送对话消息
  Stream<String> sendMessageStream({
    required String sessionId,
    required String message,
    String? audioUrl,
  }) {
    if (ApiConfig.demoMode) {
      return Stream<String>.value('data: demo\n\n');
    }
    return _client.postSSE(
      ApiRoutes.trainingMessage,
      data: {
        'sessionId': sessionId,
        'message': message,
        if (audioUrl != null) 'audioUrl': audioUrl,
      },
    );
  }

  /// 结束训练
  Future<Map<String, dynamic>> endTraining(String sessionId) async {
    if (ApiConfig.demoMode) {
      return DemoData.endTraining();
    }
    final res = await _client.post(
      ApiRoutes.trainingEnd,
      data: {'sessionId': sessionId},
    );
    final apiRes = ApiResponse.fromJson(
      res.data,
      (d) => d as Map<String, dynamic>,
    );
    if (apiRes.isSuccess && apiRes.data != null) {
      return apiRes.data!;
    }
    throw Exception(apiRes.message.isNotEmpty ? apiRes.message : '结束训练失败');
  }

  /// 发送对话消息（LLM路由）
  /// 后端根据会员等级自动路由到DeepSeek或Ollama
  Future<ApiResponse<Map<String, dynamic>>> chat({
    required String sessionId,
    required String message,
    String? audioUrl,
  }) async {
    final res = await _client.post(
      ApiRoutes.trainingMessage,
      data: {
        'sessionId': sessionId,
        'message': message,
        if (audioUrl != null) 'audioUrl': audioUrl,
      },
    );
    return ApiResponse.fromJson(res.data, (d) => d as Map<String, dynamic>);
  }

  /// 获取训练记录列表
  Future<ApiResponse<List<TrainingModel>>> getRecords({int page = 1}) async {
    final res = await _client.get(
      ApiRoutes.trainingRecords,
      queryParameters: {'page': page},
    );
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => TrainingModel.fromJson(e)).toList(),
    );
  }

  /// 获取训练详情
  Future<ApiResponse<TrainingModel>> getRecordDetail({
    required String recordId,
  }) async {
    final res = await _client.get(
      '${ApiRoutes.trainingRecordDetail}/$recordId',
    );
    return ApiResponse.fromJson(res.data, (d) => TrainingModel.fromJson(d));
  }

  /// 使用道具
  Future<Map<String, dynamic>> useItem({
    required String sessionId,
    required String itemId,
  }) async {
    final res = await _client.post(
      '${ApiRoutes.trainingStart}/item/use',
      data: {
        'sessionId': sessionId,
        'itemId': itemId,
      },
    );
    final apiRes = ApiResponse.fromJson(
      res.data,
      (d) => d as Map<String, dynamic>,
    );
    if (apiRes.isSuccess && apiRes.data != null) {
      return apiRes.data!;
    }
    throw Exception(apiRes.message.isNotEmpty ? apiRes.message : '使用道具失败');
  }
}
