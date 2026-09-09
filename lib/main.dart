
import 'package:flutter/material.dart';
import 'app.dart';
import 'network/services/auth_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final isLoggedIn = await AuthService().isLoggedIn();
  runApp(DuiLianApp(initialRoute: isLoggedIn ? '/home' : '/login'));
}
