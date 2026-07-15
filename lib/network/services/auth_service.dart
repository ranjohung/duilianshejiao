import 'package:shared_preferences/shared_preferences.dart';
import '../api_client.dart';
import '../api_routes.dart';
import '../api_response.dart';

/// 认证服务 - 注册/登录/实名认证
/// 注册即触发实名认证（PRD合规要求）
class AuthService {
  final _client = ApiClient.instance;

  /// 注册（同时触发实名认证）
  /// 新用户通过登录接口自动注册，此方法用于需要额外信息的场景
  Future<ApiResponse> register({
    required String phone,
    required String code,
    required String nickname,
  }) async {
    final res = await _client.post(
      ApiRoutes.register,
      data: {'phone': phone, 'code': code, 'nickname': nickname},
    );
    final result = ApiResponse.fromJson(res.data, null);
    // 注册成功后自动保存token
    if (result.isSuccess && result.data != null) {
      await _saveTokens(result.data as Map<String, dynamic>);
    }
    return result;
  }

  /// 手机号+验证码登录（新用户自动注册）
  /// 后端接口：POST /api/auth/login
  /// 请求参数：{ phone, code }
  /// 响应数据：{ token, refreshToken, needRealNameVerify, user }
  Future<ApiResponse> login({
    required String phone,
    required String code,
  }) async {
    final res = await _client.post(
      ApiRoutes.login,
      data: {'phone': phone, 'code': code},
    );
    final result = ApiResponse.fromJson(res.data, null);
    // 登录成功后自动保存token
    if (result.isSuccess && result.data != null) {
      await _saveTokens(result.data as Map<String, dynamic>);
    }
    return result;
  }

  /// 实名认证
  /// 后端接口：POST /api/auth/verify-real-name
  /// 请求参数：{ realName, idCard }
  Future<ApiResponse> verifyRealName({
    required String realName,
    required String idCard,
  }) async {
    final res = await _client.post(
      ApiRoutes.verifyRealName,
      data: {'realName': realName, 'idCard': idCard},
    );
    return ApiResponse.fromJson(res.data, null);
  }

  /// 发送验证码
  /// 后端接口：POST /api/auth/send-code
  /// 请求参数：{ phone }
  Future<ApiResponse> sendCode({required String phone}) async {
    final res = await _client.post(ApiRoutes.sendCode, data: {'phone': phone});
    return ApiResponse.fromJson(res.data, null);
  }

  /// 刷新Token
  /// 后端接口：POST /api/auth/refresh
  /// 请求参数：{ refreshToken }
  /// 响应数据：{ token, refreshToken }
  Future<ApiResponse> refreshToken({required String refreshToken}) async {
    final res = await _client.post(
      ApiRoutes.refreshToken,
      data: {'refreshToken': refreshToken},
    );
    final result = ApiResponse.fromJson(res.data, null);
    // 刷新成功后更新本地token
    if (result.isSuccess && result.data != null) {
      await _saveTokens(result.data as Map<String, dynamic>);
    }
    return result;
  }

  /// 保存token到本地存储
  Future<void> _saveTokens(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    if (data['token'] != null) {
      await prefs.setString('auth_token', data['token'] as String);
    }
    if (data['refreshToken'] != null) {
      await prefs.setString('refresh_token', data['refreshToken'] as String);
    }
  }

  /// 退出登录，清除本地token
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
  }

  /// 获取当前是否已登录
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token') != null;
  }
}
