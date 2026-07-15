import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../config/app_config.dart';
import '../../network/services/social_service.dart';
import '../../network/api_response.dart';

/// 邀请好友页
/// 展示：邀请码、邀请链接、已邀请人数、奖励说明
class InvitePage extends StatefulWidget {
  const InvitePage({super.key});

  @override
  State<InvitePage> createState() => _InvitePageState();
}

class _InvitePageState extends State<InvitePage> {
  final _socialService = SocialService();
  bool _loading = true;
  String _inviteCode = '';
  String _inviteLink = '';
  int _invitedCount = 0;
  String _reward = '';

  @override
  void initState() {
    super.initState();
    _loadInviteInfo();
  }

  Future<void> _loadInviteInfo() async {
    try {
      final res = await _socialService.getInviteInfo();
      if (res.isSuccess && res.data != null) {
        setState(() {
          _inviteCode = res.data!['inviteCode'] ?? '';
          _inviteLink = res.data!['inviteLink'] ?? '';
          _invitedCount = res.data!['invitedCount'] ?? 0;
          _reward = res.data!['reward'] ?? '';
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _copyInviteCode() {
    Clipboard.setData(ClipboardData(text: _inviteCode));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('邀请码已复制'), duration: Duration(seconds: 1)),
    );
  }

  void _copyInviteLink() {
    Clipboard.setData(ClipboardData(text: _inviteLink));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('邀请链接已复制'), duration: Duration(seconds: 1)),
    );
  }

  void _shareInvite() {
    // TODO: 调用系统分享功能
    final shareText = '我在对练社交练习社交技能！快来加入吧，输入邀请码 $_inviteCode，双方各获1张时空穿梭券！';
    Clipboard.setData(ClipboardData(text: shareText));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('分享内容已复制到剪贴板'), duration: Duration(seconds: 1)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('邀请好友'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildHeaderCard(),
                const SizedBox(height: 20),
                _buildInviteCodeCard(),
                const SizedBox(height: 16),
                _buildInviteLinkCard(),
                const SizedBox(height: 16),
                _buildStatsCard(),
                const SizedBox(height: 16),
                _buildRewardCard(),
                const SizedBox(height: 24),
                _buildShareButton(),
              ],
            ),
    );
  }

  /// 顶部说明
  Widget _buildHeaderCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E3A5F), Color(0xFF2C5F8A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.card_giftcard, color: Colors.amber, size: 28),
              SizedBox(width: 10),
              Text(
                '邀请好友，双方各获1张时空穿梭券',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SizedBox(height: 10),
          Text(
            '分享你的邀请码给好友，好友注册时填写邀请码，双方各获1张时空穿梭券奖励！',
            style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.5),
          ),
        ],
      ),
    );
  }

  /// 邀请码展示
  Widget _buildInviteCodeCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '我的邀请码',
            style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F7FA),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppConfig.primaryColor.withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    _inviteCode,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppConfig.primaryColor,
                      letterSpacing: 4,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _copyInviteCode,
                  icon: const Icon(Icons.copy, size: 18),
                  label: const Text('复制'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConfig.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 邀请链接展示
  Widget _buildInviteLinkCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '邀请链接',
            style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F7FA),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _inviteLink,
                    style: const TextStyle(fontSize: 13, color: Colors.black54),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _copyInviteLink,
                icon: Icon(Icons.copy, color: AppConfig.primaryColor, size: 22),
                tooltip: '复制链接',
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 已邀请人数
  Widget _buildStatsCard() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people, color: AppConfig.accentColor, size: 26),
          const SizedBox(width: 10),
          const Text(
            '已成功邀请',
            style: TextStyle(fontSize: 15, color: Colors.black54),
          ),
          const SizedBox(width: 8),
          Text(
            '$_invitedCount',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppConfig.primaryColor,
            ),
          ),
          const SizedBox(width: 4),
          const Text(
            '人',
            style: TextStyle(fontSize: 15, color: Colors.black54),
          ),
        ],
      ),
    );
  }

  /// 奖励说明
  Widget _buildRewardCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppConfig.accentColor.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppConfig.accentColor.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppConfig.accentColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.auto_awesome, color: AppConfig.accentColor, size: 22),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '奖励规则',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                SizedBox(height: 4),
                Text(
                  '每成功邀请一位好友，双方各获1张时空穿梭券，邀请人数无上限！',
                  style: TextStyle(fontSize: 12, color: Colors.black54, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 分享按钮
  Widget _buildShareButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: _shareInvite,
        icon: const Icon(Icons.share, size: 20),
        label: const Text('分享给好友', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppConfig.primaryColor,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}
