import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/growth_model.dart';
import '../../models/achievement_model.dart';
import '../../models/emotion_diary_model.dart';
import '../../models/learning_card_model.dart';

/// 成长服务
class GrowthService {
  final _client = ApiClient.instance;

  /// 获取能力雷达图
  Future<ApiResponse<GrowthModel>> getRadar() async {
    final res = await _client.get(ApiRoutes.growthRadar);
    return ApiResponse.fromJson(res.data, (d) => GrowthModel.fromJson(d));
  }

  /// 获取进步曲线（7天/30天）
  Future<ApiResponse<List<double>>> getProgress({int days = 7}) async {
    final res = await _client.get(
      ApiRoutes.growthProgress,
      queryParameters: {'days': days},
    );
    return ApiResponse.fromJson(
      res.data,
      (d) => (d as List).map((e) => (e as num).toDouble()).toList(),
    );
  }

  /// 获取每周报告
  Future<ApiResponse<Map<String, dynamic>>> getWeeklyReport() async {
    final res = await _client.get(ApiRoutes.growthWeeklyReport);
    return ApiResponse.fromJson(res.data, (d) => d as Map<String, dynamic>);
  }

  /// 获取里程碑
  Future<ApiResponse<List<AchievementModel>>> getMilestones() async {
    final res = await _client.get(ApiRoutes.growthMilestones);
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => AchievementModel.fromJson(e)).toList(),
    );
  }

  /// 获取情绪日记列表
  Future<ApiResponse<List<EmotionDiaryModel>>> getEmotionDiaries({
    int page = 1,
  }) async {
    final res = await _client.get(
      ApiRoutes.emotionDiaries,
      queryParameters: {'page': page},
    );
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => EmotionDiaryModel.fromJson(e)).toList(),
    );
  }

  /// 获取学习卡片列表
  Future<ApiResponse<List<LearningCardModel>>> getLearningCards({
    bool? collected,
    int page = 1,
  }) async {
    final res = await _client.get(
      ApiRoutes.learningCards,
      queryParameters: {
        if (collected != null) 'collected': collected,
        'page': page,
      },
    );
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => LearningCardModel.fromJson(e)).toList(),
    );
  }

  /// 收藏/取消收藏学习卡片
  Future<ApiResponse> toggleCollectCard({required String cardId}) async {
    final res = await _client.post(
      '${ApiRoutes.learningCardCollect}/$cardId/collect',
    );
    return ApiResponse.fromJson(res.data, null);
  }

  /// 获取成就列表
  Future<ApiResponse<List<AchievementModel>>> getAchievements() async {
    final res = await _client.get(ApiRoutes.achievements);
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => AchievementModel.fromJson(e)).toList(),
    );
  }
}
