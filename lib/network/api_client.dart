import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../config/api_config.dart';
import 'api_interceptor.dart';

/// Dio HTTP客户端封装
/// 支持常规REST请求、流式SSE请求（LLM对话）、文件上传
class ApiClient {
  static ApiClient? _instance;
  late final Dio _dio;

  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.apiBasePath,
        connectTimeout: Duration(milliseconds: AppConfig.connectTimeout),
        receiveTimeout: Duration(milliseconds: AppConfig.receiveTimeout),
        sendTimeout: Duration(milliseconds: AppConfig.sendTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(ApiInterceptor());
  }

  static ApiClient get instance => _instance ??= ApiClient._();

  Dio get dio => _dio;

  /// GET请求
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.get(path, queryParameters: queryParameters, options: options);
  }

  /// POST请求
  Future<Response> post(String path, {dynamic data, Options? options}) {
    return _dio.post(path, data: data, options: options);
  }

  /// PUT请求
  Future<Response> put(String path, {dynamic data, Options? options}) {
    return _dio.put(path, data: data, options: options);
  }

  /// DELETE请求
  Future<Response> delete(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.delete(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  /// 文件上传
  Future<Response> upload(
    String path, {
    required String filePath,
    String fieldName = 'file',
    Map<String, dynamic>? extraData,
    ProgressCallback? onSendProgress,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath),
      if (extraData != null) ...extraData,
    });
    return _dio.post(
      path,
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
      onSendProgress: onSendProgress,
    );
  }

  /// SSE流式请求（用于LLM对话流式输出）
  /// 返回Stream<String>，每个元素为一个chunk
  Stream<String> sseStream(String path, {required Map<String, dynamic> data}) {
    // 使用Dio的fetch + responseType.stream 实现SSE
    // 实际实现需要配合服务端的SSE或WebSocket
    throw UnimplementedError('SSE stream 需配合服务端实现，MVP阶段使用普通POST+轮询');
  }

  /// SSE流式POST请求
  /// 使用dio发送请求，以stream方式读取响应，yield每个SSE chunk
  Stream<String> postSSE(String path, {Map<String, dynamic>? data}) async* {
    final response = await _dio.post(
      path,
      data: data,
      options: Options(
        responseType: ResponseType.stream,
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        receiveTimeout: const Duration(minutes: 5),
      ),
    );

    final stream = response.data as ResponseBody;
    String buffer = '';

    await for (final chunk in stream.stream) {
      buffer += String.fromCharCodes(chunk);
      // 按SSE协议解析：以双换行分隔事件
      while (buffer.contains('\n\n')) {
        final index = buffer.indexOf('\n\n');
        final event = buffer.substring(0, index);
        buffer = buffer.substring(index + 2);

        // 解析data:行
        for (final line in event.split('\n')) {
          if (line.startsWith('data: ')) {
            final dataContent = line.substring(6).trim();
            if (dataContent == '[DONE]') return;
            if (dataContent.isNotEmpty) yield dataContent;
          }
        }
      }
    }

    // 处理buffer中剩余内容
    if (buffer.isNotEmpty) {
      for (final line in buffer.split('\n')) {
        if (line.startsWith('data: ')) {
          final dataContent = line.substring(6).trim();
          if (dataContent.isNotEmpty && dataContent != '[DONE]') {
            yield dataContent;
          }
        }
      }
    }
  }
}
