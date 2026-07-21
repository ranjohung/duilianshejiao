
import 'package:flutter/material.dart';
import '../../config/app_config.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('我的'),
        backgroundColor: AppConfig.primaryColor,
      ),
      body: const Center(
        child: Text('个人中心开发中'),
      ),
    );
  }
}
