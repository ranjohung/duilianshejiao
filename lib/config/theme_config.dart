
import 'package:flutter/material.dart';

/// 主题配置
class ThemeConfig {
  ThemeConfig._();

  /// 主色调
  static const Color primaryColor = Color(0xFF4A90D9);

  /// 辅助色
  static const Color secondaryColor = Color(0xFF6C5CE7);

  /// 强调色/CTA
  static const Color accentColor = Color(0xFFFF6B6B);

  /// 背景色
  static const Color backgroundColor = Color(0xFFF5F6FA);

  /// 文字主色
  static const Color textPrimaryColor = Color(0xFF2D3436);

  /// 文字辅助色
  static const Color textSecondaryColor = Color(0xFF636E72);

  /// 分隔线颜色
  static const Color dividerColor = Color(0xFFDFE6E9);

  /// 构建亮色主题
  static ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: primaryColor,
        scaffoldBackgroundColor: backgroundColor,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: textPrimaryColor,
          elevation: 0,
        ),
        dividerColor: dividerColor,
      );

  /// 构建暗色主题
  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: primaryColor,
        brightness: Brightness.dark,
      );
}
