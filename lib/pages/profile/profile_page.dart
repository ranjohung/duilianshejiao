import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../network/services/auth_service.dart';

/// 个人中心基础闭环：资料、会员/支付状态、道具和退出登录。
/// 支付按钮明确保持“接入中”，不在客户端伪造购买成功。
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  void _showMembership(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('会员中心', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          const Text('支付服务尚未接入，当前不会扣款或开通会员。', style: TextStyle(color: Colors.black54, fontSize: 13)),
          const SizedBox(height: 14),
          ...const [('体验日卡', '¥3.9 / 1天'), ('周卡', '¥19.9 / 7天'), ('月卡', '¥69 / 30天'), ('年卡', '¥499 / 365天')].map((plan) => ListTile(contentPadding: EdgeInsets.zero, leading: Icon(Icons.workspace_premium_rounded, color: AppConfig.accentColor), title: Text(plan.$1), subtitle: Text(plan.$2), trailing: const Text('支付接入中', style: TextStyle(color: Colors.black45)))),
        ]),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    await AuthService().logout();
    if (context.mounted) Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(title: const Text('我的'), backgroundColor: AppConfig.primaryColor, foregroundColor: Colors.white),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Card(elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), child: const ListTile(contentPadding: EdgeInsets.all(12), leading: CircleAvatar(radius: 28, backgroundColor: Color(0xFFE8F0FE), child: Icon(Icons.person_rounded, color: AppConfig.primaryColor, size: 30)), title: Text('演示用户', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)), subtitle: Text('免费用户 · 训练积分 320'))),
        const SizedBox(height: 12),
        _buildAction(context, Icons.workspace_premium_rounded, '会员中心', '查看方案与权益（支付接入中）', () => _showMembership(context)),
        _buildAction(context, Icons.backpack_rounded, '道具背包', '管理时空穿梭券和训练道具', () => _showMessage(context, '道具背包将在训练中心使用')),
        _buildAction(context, Icons.settings_rounded, '训练设置', '提醒、防沉迷与隐私设置', () => _showMessage(context, '设置保存功能已在后续版本开放')),
        const SizedBox(height: 22),
        OutlinedButton.icon(onPressed: () => _logout(context), icon: const Icon(Icons.logout_rounded), label: const Text('退出登录')),
      ]),
    );
  }

  Widget _buildAction(BuildContext context, IconData icon, String title, String subtitle, VoidCallback onTap) {
    return Card(elevation: 0, margin: const EdgeInsets.only(bottom: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), child: ListTile(onTap: onTap, leading: Icon(icon, color: AppConfig.primaryColor), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(subtitle), trailing: const Icon(Icons.chevron_right_rounded, color: Colors.black38)));
  }
}
