import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/social_post_model.dart';

/// 社交服务（AI教练朋友圈+好友邀请+社交裂变）
class SocialService {
  final _client = ApiClient.instance;

  /// 获取教练朋友圈列表
  Future<ApiResponse<List<SocialPostModel>>> getPosts({int page = 1}) async {
    final res = await _client.get(
      ApiRoutes.socialPosts,
      queryParameters: {'page': page},
    );
    return ApiResponse.fromJsonList(
      res.data,
      (d) => d.map((e) => SocialPostModel.fromJson(e)).toList(),
    );
  }

  /// 评论教练朋友圈
  Future<ApiResponse> comment({
    required String postId,
    required String content,
  }) async {
    final res = await _client.post(
      '${ApiRoutes.socialComment}/$postId/comment',
      data: {'content': content},
    );
    return ApiResponse.fromJson(res.data, null);
  }

  /// 邀请好友（生成邀请码/链接）
  Future<ApiResponse<Map<String, dynamic>>> inviteFriend() async {
    final res = await _client.post(ApiRoutes.socialInvite);
    return ApiResponse.fromJson(res.data, (d) => d as Map<String, dynamic>);
  }

  /// 获取邀请信息（邀请码+已邀请人数+奖励）
  Future<ApiResponse<Map<String, dynamic>>> getInviteInfo() async {
    final res = await _client.get(ApiRoutes.socialInvite);
    return ApiResponse.fromJson(res.data, (d) => d as Map<String, dynamic>);
  }

  /// 使用邀请码
  Future<ApiResponse> useInviteCode({required String code}) async {
    final res = await _client.post(
      '${ApiRoutes.socialInvite}/use',
      data: {'code': code},
    );
    return ApiResponse.fromJson(res.data, null);
  }

  /// 分享成就卡片
  Future<ApiResponse<Map<String, dynamic>>> shareAchievement({
    required String achievementId,
  }) async {
    final res = await _client.post(
      ApiRoutes.socialShareAchievement,
      data: {'achievementId': achievementId},
    );
    return ApiResponse.fromJson(res.data, (d) => d as Map<String, dynamic>);
  }

  /// 组队训练互动
  Future<ApiResponse> teamTraining({
    required String trainingId,
    String? comment,
    String? emoji,
  }) async {
    final data = <String, dynamic>{'trainingId': trainingId};
    if (comment != null) data['comment'] = comment;
    if (emoji != null) data['emoji'] = emoji;
    final res = await _client.post(ApiRoutes.socialTeamTraining, data: data);
    return ApiResponse.fromJson(res.data, null);
  }

  /// 获取组队训练状态
  Future<ApiResponse<Map<String, dynamic>>> getTeamTrainingStatus({
    required String trainingId,
  }) async {
    final res = await _client.get(
      '${ApiRoutes.socialTeamTraining}/$trainingId',
    );
    return ApiResponse.fromJson(res.data, (d) => d as Map<String, dynamic>);
  }

  /// 获取好友排行榜
  /// type: training_days(训练天数) / scene_count(完成场景数)
  Future<ApiResponse<Map<String, dynamic>>> getLeaderboard({
    String type = 'training_days',
    int limit = 20,
  }) async {
    final res = await _client.get(
      ApiRoutes.socialLeaderboard,
      queryParameters: {'type': type, 'limit': limit},
    );
    return ApiResponse.fromJson(res.data, (d) => d as Map<String, dynamic>);
  }
}
