
/// API地址配置
class ApiConfig {
  ApiConfig._();

  /// API基础地址（根据环境切换）
  /// 可通过 --dart-define=API_BASE_URL=https://api.example.com 覆盖。
  /// Android 模拟器访问宿主机使用 10.0.2.2；真机与生产环境必须显式配置。
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// API版本前缀
  static const String apiVersion = '/v1';

  /// 仅供本地 Debug/模拟器验收的显式演示开关，默认关闭；生产构建不得开启。
  static const bool demoMode = bool.fromEnvironment(
    'DEMO_MODE',
    defaultValue: false,
  );

  /// 完整API基础路径
  static String get apiBasePath => apiBaseUrl;

  /// LLM服务基础地址
  static const String llmBaseUrl = 'https://llm.duilian.example.com';

  /// DeepSeek 服务地址与密钥通过 dart-define 注入，源码不保存生产密钥。
  static const String deepseekBaseUrl = String.fromEnvironment(
    'DEEPSEEK_BASE_URL',
    defaultValue: 'https://api.deepseek.com',
  );
  static const String deepseekApiKey = String.fromEnvironment(
    'DEEPSEEK_API_KEY',
    defaultValue: '',
  );

  /// 本地 Ollama 地址；Android 模拟器通过 10.0.2.2 访问宿主机。
  static const String ollamaBaseUrl = String.fromEnvironment(
    'OLLAMA_BASE_URL',
    defaultValue: 'http://10.0.2.2:11434',
  );

  /// CDN基础地址（图片、Spine动画等静态资源）
  static const String cdnBaseUrl = 'https://cdn.duilian.example.com';

  /// WebSocket地址（实时对练通信）
  static const String wsBaseUrl = 'wss://ws.duilian.example.com';
}
