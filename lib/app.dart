import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'pages/auth/login_page.dart';
import 'pages/auth/real_name_page.dart';
import 'pages/home/home_page.dart';
import 'pages/coach/coach_page.dart';
import 'pages/coach/coach_list_page.dart';
import 'pages/coach/coach_detail_page.dart';
import 'pages/scene/scene_page.dart';
import 'pages/scene/scene_select_page.dart';
import 'pages/training/training_page.dart';
import 'pages/training/training_result_page.dart';
import 'pages/growth/growth_page.dart';
import 'pages/profile/profile_page.dart';

/// 对练社交App主入口
/// 底部5个Tab导航：首页 / 教练 / 场景 / 成长 / 我的
class DuiLianApp extends StatelessWidget {
  final String initialRoute;

  const DuiLianApp({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '对练社交',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        primaryColor: AppConfig.primaryColor,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppConfig.primaryColor,
          primary: AppConfig.primaryColor,
          secondary: AppConfig.accentColor,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppConfig.primaryColor,
            foregroundColor: Colors.white,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppConfig.primaryColor, width: 1.5),
          ),
        ),
      ),
      initialRoute: initialRoute,
      routes: {
        '/login': (context) => const LoginPage(),
        '/real-name': (context) => const RealNamePage(),
        '/home': (context) => const MainNavigation(),
        '/coach-list': (context) => const CoachListPage(),
        '/scene-select': (context) => const SceneSelectPage(coachName: '教练', coachColor: AppConfig.primaryColor),
        '/training-result': (context) => _buildTrainingResultPage(context),
      },
    );
  }
}

/// 构建训练结果页面（从路由arguments获取结果数据）
Widget _buildTrainingResultPage(BuildContext context) {
  final args = ModalRoute.of(context)?.settings.arguments;
  if (args is Map<String, dynamic>) {
    return TrainingResultPage(result: args);
  }
  return const TrainingResultPage(result: {});
}

/// 主导航页面，包含5个Tab的BottomNavigationBar
class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  /// 5个Tab对应的页面
  static const List<Widget> _pages = [
    HomePage(),
    CoachPage(),
    ScenePage(),
    GrowthPage(),
    ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppConfig.primaryColor,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: '首页'),
          BottomNavigationBarItem(icon: Icon(Icons.school), label: '教练'),
          BottomNavigationBarItem(icon: Icon(Icons.theater_comedy), label: '场景'),
          BottomNavigationBarItem(icon: Icon(Icons.trending_up), label: '成长'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: '我的'),
        ],
      ),
    );
  }
}
