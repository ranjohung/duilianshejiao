import 'dart:convert';

import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'api_interceptor.dart';

/// 统一 API 客户端。所有业务 Service 均使用 Dio Response 的 data 字段解析响应。
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  static ApiClient get instance => _instance;

  late final Dio _dio;

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 10),
      headers: const {'Content-Type': 'application/json'},
    ));
    _dio.interceptors.add(ApiInterceptor());
  }

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response<dynamic>> post(
    String path, {
    Map<String, String>? headers,
    dynamic data,
  }) {
    return _dio.post(path, data: data, options: Options(headers: headers));
  }

  Future<Response<dynamic>> put(
    String path, {
    Map<String, String>? headers,
    dynamic data,
  }) {
    return _dio.put(path, data: data, options: Options(headers: headers));
  }

  Future<Response<dynamic>> delete(
    String path, {
    Map<String, String>? headers,
  }) {
    return _dio.delete(path, options: Options(headers: headers));
  }

  /// 以 SSE 方式提交训练消息。
  /// 当前客户端只负责把服务端文本块逐段转发给上层；若服务端尚未启用
  /// text/event-stream，调用方仍可回退到普通 post 接口。
  Stream<String> postSSE(
    String path, {
    Map<String, String>? headers,
    dynamic data,
  }) async* {
    final response = await _dio.post<ResponseBody>(
      path,
      data: data,
      options: Options(
        headers: {
          ...?headers,
          'Accept': 'text/event-stream',
        },
        responseType: ResponseType.stream,
      ),
    );
    final body = response.data;
    if (body == null) return;
    await for (final chunk in body.stream) {
      if (chunk.isNotEmpty) yield utf8.decode(chunk, allowMalformed: true);
    }
  }
}
