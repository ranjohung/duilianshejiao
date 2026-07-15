import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 请求/响应拦截器
/// 处理：Token注入、请求日志、401自动刷新Token、错误统一处理、防沉迷检查
class ApiInterceptor extends Interceptor {
  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Token注入
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // 设备信息注入
    options.headers['X-Device-Id'] = prefs.getString('device_id') ?? '';
    options.headers['X-App-Version'] = '1.0.0';

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // 统一响应处理：检查业务code
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final code = data['code'];
      if (code != null && code != 0) {
        // 业务错误
        handler.reject(
          DioException(
            requestOptions: response.requestOptions,
            response: response,
            type: DioExceptionType.badResponse,
            error: '业务错误: $code - ${data['message'] ?? ''}',
          ),
        );
        return;
      }
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    switch (err.response?.statusCode) {
      case 401:
        // Token过期，尝试刷新
        final refreshed = await _tryRefreshToken();
        if (refreshed) {
          // 重试原请求
          final response = await _retry(err.requestOptions);
          handler.resolve(response);
          return;
        }
        // 刷新失败，跳转登录
        // TODO: 通知全局状态跳转登录页
        break;
      case 403:
        // 权限不足（如：未解锁场景、防沉迷限制）
        break;
      case 429:
        // 请求频率限制
        break;
      case 500:
        // 服务器内部错误
        break;
    }
    handler.next(err);
  }

  /// 尝试刷新Token
  Future<bool> _tryRefreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refresh_token');
      if (refreshToken == null) return false;

      // TODO: 调用刷新Token接口
      // final res = await Dio().post('${ApiConfig.apiBasePath}/auth/refresh',
      //     data: {'refreshToken': refreshToken});
      // await prefs.setString('auth_token', res.data['data']['token']);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// 重试请求
  Future<Response> _retry(RequestOptions requestOptions) async {
    final dio = Dio();
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token != null) {
      requestOptions.headers['Authorization'] = 'Bearer $token';
    }
    return dio.fetch(requestOptions);
  }
}
