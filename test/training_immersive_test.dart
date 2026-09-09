import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:duilian_social/demo/demo_data.dart';
import 'package:duilian_social/models/scene_model.dart';
import 'package:duilian_social/pages/training/training_page.dart';

void main() {
  SceneModel cafeScene() => SceneModel(
        id: 'demo-scene-01',
        name: '咖啡厅的邂逅',
        stage: '破冰入门',
        difficulty: '入门',
        description: '在咖啡厅自然地开启对话',
        rounds: 3,
        npcName: '小雨',
        npcAvatar: '',
        opening: '你好，很高兴认识你。我们从一个轻松的话题开始吧。',
        stageDisplayName: '破冰入门',
        difficultyText: '入门',
        estimatedDuration: 5,
        teachingPoint: '先回应对方，再补充自己的信息，最后抛出一个开放问题。',
      );

  Future<void> pumpPage(
    WidgetTester tester, {
    TrainingMode mode = TrainingMode.etiquette,
  }) async {
    await tester.pumpWidget(MaterialApp(
      home: TrainingPage(
        coach: DemoData.defaultCoach,
        scene: cafeScene(),
        mode: mode,
      ),
    ));
    // 舞台待机动画无限循环，不能用 pumpAndSettle，用固定时长推进
    await tester.pump(const Duration(seconds: 4));
  }

  testWidgets('礼仪训练：沉浸式舞台 + 头顶气泡 + 输入前 A/B/C 选项', (tester) async {
    await pumpPage(tester);

    // 沉浸式舞台标签（咖啡厅环境）
    expect(find.textContaining('沉浸式现场'), findsOneWidget);
    expect(find.text('沉浸式现场 · 咖啡厅'), findsOneWidget);

    // NPC 开场白以头顶气泡显示
    expect(find.textContaining('我们从一个轻松的话题开始吧'), findsOneWidget);

    // 名牌：主角 + NPC
    expect(find.text('我'), findsWidgets);
    expect(find.text('小雨'), findsOneWidget);

    // 输入前有 A/B/C 参考选项
    expect(find.text('参考回应（可点选，也可自己输入）'), findsOneWidget);
    expect(find.text('A'), findsOneWidget);
    expect(find.text('B'), findsOneWidget);
    expect(find.text('C'), findsOneWidget);

    // 点选 A 后出现教练评价卡（先确保选项在视口内）
    await tester.ensureVisible(find.text('A'));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.tap(find.text('A'));
    await tester.pump(const Duration(seconds: 5));
    expect(find.textContaining('的点评'), findsOneWidget);
    expect(find.textContaining('分'), findsWidgets);
  });

  testWidgets('真实挑战：输入前无任何提示选项，直接自由输入', (tester) async {
    await pumpPage(tester, mode: TrainingMode.challenge);

    // 沉浸式舞台与头顶气泡仍存在
    expect(find.textContaining('沉浸式现场'), findsOneWidget);
    expect(find.textContaining('很高兴认识你'), findsOneWidget);

    // 无 A/B/C 参考选项区
    expect(find.text('参考回应（可点选，也可自己输入）'), findsNothing);
    expect(find.text('A'), findsNothing);

    // 输入提示语为挑战模式文案
    expect(find.text('直接输入你的回应…'), findsOneWidget);
  });
}
