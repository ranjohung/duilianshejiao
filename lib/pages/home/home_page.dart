import 'package:flutter/material.dart';

/// Tab1 首页
/// 展示：推荐教练、热门场景、今日打卡、社交动态
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('对练社交')),
      body: const Center(child: Text('首页 - 待实现')),
    );
  }
}
