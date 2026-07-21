
import 'package:flutter/material.dart';
import '../../config/app_config.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('对练社交'),
        backgroundColor: AppConfig.primaryColor,
      ),
      body: const Center(
        child: Text('首页内容开发中'),
      ),
    );
  }
}
