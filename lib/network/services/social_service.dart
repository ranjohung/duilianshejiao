import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/social_post_model.dart';

/// 社交服务（AI教练朋友圈+好友邀请）
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

  /// 邀请好友
  Future<ApiResponse> invite({required String inviteCode}) async {
    final res = await _client.post(
      ApiRoutes.socialInvite,
      data: {'inviteCode': inviteCode},
    );
    return ApiResponse.fromJson(res.data, null);
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
