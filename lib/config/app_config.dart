import 'package:flutter/material.dart';

/// 应用全局配置
class AppConfig {
  AppConfig._();

  // ============ 颜色常量 ============
  static const Color primaryColor = Color(0xFF1E3A5F);    // 深蓝
  static const Color accentColor = Color(0xFFF5A623);     // 金色
  static const Color successColor = Color(0xFF4CAF50);    // 绿色
  static const Color warningColor = Color(0xFFFF9800);    // 橙色
  static const Color dangerColor = Color(0xFFF44336);     // 红色

  /// 应用名称
  static const String appName = '对练社交';

  /// 应用版本
  static const String appVersion = '1.0.0';

  /// 构建环境: dev / staging / production
  static const String environment = 'dev';

  /// 是否为调试模式
  static bool get isDebug => environment == 'dev';

  /// 默认超时时间（毫秒）
  static const int connectTimeout = 15000;
  static const int receiveTimeout = 15000;
  static const int sendTimeout = 15000;

  /// 每页默认数量
  static const int pageSize = 20;

  /// 声网App ID
  static const String agoraAppId = 'YOUR_AGORA_APP_ID';
}
