import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:duilian_social/app.dart';

void main() {
  testWidgets('登录页显示产品身份和登录控件', (WidgetTester tester) async {
    await tester.pumpWidget(const DuiLianApp(initialRoute: '/login'));

    expect(find.text('对练社交'), findsOneWidget);
    expect(find.text('AI驱动的社交训练平台'), findsOneWidget);
    expect(find.text('密码登录'), findsOneWidget);
    expect(find.text('短信验证码'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.text('登录'), findsOneWidget);
  });
}
