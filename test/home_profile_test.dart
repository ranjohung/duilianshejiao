import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:duilian_social/app.dart';

void main() {
  testWidgets('首页展示训练项目，个人中心展示会员入口', (tester) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    await tester.pumpWidget(const DuiLianApp(initialRoute: '/home'));
    await tester.pumpAndSettle();

    expect(find.text('选择训练项目'), findsOneWidget);
    expect(find.text('初次见面'), findsOneWidget);
    expect(find.text('加薪谈判'), findsOneWidget);

    await tester.tap(find.text('我的'));
    await tester.pumpAndSettle();
    expect(find.text('会员中心'), findsOneWidget);
    expect(find.text('个人中心开发中'), findsNothing);
  });
}
