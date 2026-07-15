import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';
import '../../models/user_model.dart';
import '../../models/growth_model.dart';

/// 用户服务
class UserService {
  final _client = ApiClient.instance;

  /// 获取用户资料
  Future<ApiResponse<UserModel>> getProfile() async {
    final res = await _client.get(ApiRoutes.userProfile);
    return ApiResponse.fromJson(res.data, (d) => UserModel.fromJson(d));
  }

  /// 更新用户资料
  Future<ApiResponse<UserModel>> updateProfile({
    String? nickname,
    String? avatar,
    int? gender,
    String? currentCoachId,
  }) async {
    final res = await _client.put(
      ApiRoutes.userUpdate,
      data: {
        if (nickname != null) 'nickname': nickname,
        if (avatar != null) 'avatar': avatar,
        if (gender != null) 'gender': gender,
        if (currentCoachId != null) 'currentCoachId': currentCoachId,
      },
    );
    return ApiResponse.fromJson(res.data, (d) => UserModel.fromJson(d));
  }

  /// 获取用户成长数据
  Future<ApiResponse<GrowthModel>> getGrowth() async {
    final res = await _client.get(ApiRoutes.userGrowth);
    return ApiResponse.fromJson(res.data, (d) => GrowthModel.fromJson(d));
  }
}
