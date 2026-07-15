import 'package:flutter/material.dart';

/// Tab5 我的页
/// 展示：个人资料、会员信息、商品道具、设置
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('我的')),
      body: const Center(child: Text('我的 - 待实现')),
    );
  }
}
