
/// API地址配置
class ApiConfig {
  ApiConfig._();

  /// API基础地址（根据环境切换）
  static const String apiBaseUrl = 'https://api.duilian.example.com';

  /// API版本前缀
  static const String apiVersion = '/v1';

  /// 完整API基础路径
  static String get apiBasePath => '$apiBaseUrl$apiVersion';

  /// LLM服务基础地址
  static const String llmBaseUrl = 'https://llm.duilian.example.com';

  /// CDN基础地址（图片、Spine动画等静态资源）
  static const String cdnBaseUrl = 'https://cdn.duilian.example.com';

  /// WebSocket地址（实时对练通信）
  static const String wsBaseUrl = 'wss://ws.duilian.example.com';
}
