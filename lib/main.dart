import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 检查是否有登录token，决定初始路由
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('auth_token');
  final initialRoute = token != null ? '/home' : '/login';

  runApp(DuiLianApp(initialRoute: initialRoute));
}
