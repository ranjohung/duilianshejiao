import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/item_model.dart';
import '../../network/services/item_service.dart';
import '../membership/membership_page.dart';
import '../goodnight/goodnight_plan_page.dart';
import '../social/invite_page.dart';

/// Tab5 我的页
/// 展示：个人资料、会员信息、训练统计、道具背包、菜单列表
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _itemService = ItemService();
  List<ItemModel> _items = [];
  bool _itemsLoading = true;

  // 模拟用户数据
  final String _nickname = '学员';
  final String _avatar = '';
  final String _memberLevel = '免费版';
  final String _studentLevel = '青铜';
  final int _trainingCount = 12;
  final int _sceneCount = 5;
  final int _streakDays = 3;

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    try {
      final res = await _itemService.getInventory();
      if (res.isSuccess && res.data != null) {
        setState(() {
          _items = res.data!;
          _itemsLoading = false;
        });
      }
    } catch (_) {
      setState(() => _itemsLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          children: [
            _buildProfileHeader(),
            const SizedBox(height: 20),
            _buildStatsCard(),
            const SizedBox(height: 16),
            _buildItemBackpack(),
            const SizedBox(height: 16),
            _buildMenuList(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  /// 顶部：头像 + 昵称 + 会员等级标签
  Widget _buildProfileHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E3A5F), Color(0xFF2C5F8A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 36,
            backgroundColor: Colors.white24,
            backgroundImage: _avatar.isNotEmpty ? NetworkImage(_avatar) : null,
            child: _avatar.isEmpty
                ? const Icon(Icons.person, color: Colors.white, size: 36)
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _nickname,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    // 会员等级
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppConfig.accentColor.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppConfig.accentColor.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.card_membership, color: AppConfig.accentColor, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            _memberLevel,
                            style: const TextStyle(
                              color: AppConfig.accentColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    // 学员等级
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$_studentLevel学员',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              // TODO: 编辑资料
            },
            icon: const Icon(Icons.edit_outlined, color: Colors.white70),
          ),
        ],
      ),
    );
  }

  /// 训练统计卡片
  Widget _buildStatsCard() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          _buildStatItem('训练次数', '$_trainingCount', Icons.fitness_center, AppConfig.primaryColor),
          _buildStatDivider(),
          _buildStatItem('场景完成', '$_sceneCount', Icons.theater_comedy, AppConfig.accentColor),
          _buildStatDivider(),
          _buildStatItem('连续签到', '$_streakDays天', Icons.local_fire_department, AppConfig.dangerColor),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color, size: 26),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildStatDivider() {
    return Container(width: 1, height: 40, color: Colors.grey[200]);
  }

  /// 道具背包
  Widget _buildItemBackpack() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '道具背包',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              TextButton(
                onPressed: () {
                  // TODO: 查看全部道具
                },
                child: Text('查看全部', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _itemsLoading
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              : _items.isEmpty
                  ? _buildDefaultItems()
                  : _buildItemsList(),
        ],
      ),
    );
  }

  /// 默认道具展示（无数据时的兜底展示）
  Widget _buildDefaultItems() {
    final defaultItems = ItemType.values;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: defaultItems.map((type) {
        return Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppConfig.primaryColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  ItemModel.itemIcons[type] ?? '📦',
                  style: const TextStyle(fontSize: 22),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              ItemModel.itemNames[type] ?? '',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 2),
            Text(
              '0',
              style: TextStyle(fontSize: 12, color: Colors.grey[500]),
            ),
          ],
        );
      }).toList(),
    );
  }

  /// 有数据时展示道具列表
  Widget _buildItemsList() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: _items.take(4).map((item) {
        return Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppConfig.primaryColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  item.itemIcon,
                  style: const TextStyle(fontSize: 22),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              item.itemTypeDisplayName,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 2),
            Text(
              '${item.quantity}',
              style: TextStyle(fontSize: 12, color: Colors.grey[500]),
            ),
          ],
        );
      }).toList(),
    );
  }

  /// 菜单列表
  Widget _buildMenuList() {
    final menus = [
      _MenuItem(Icons.card_membership, '会员中心', AppConfig.accentColor),
      _MenuItem(Icons.person_add, '邀请好友', AppConfig.primaryColor),
      _MenuItem(Icons.nightlight_round, '晚安计划', const Color(0xFF5B3FA0)),
      _MenuItem(Icons.verified_user, '实名认证', AppConfig.successColor),
      _MenuItem(Icons.lock_outline, '隐私设置', Colors.grey[600]!),
      _MenuItem(Icons.info_outline, '关于我们', AppConfig.primaryColor),
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: menus.asMap().entries.map((entry) {
          final index = entry.key;
          final menu = entry.value;
          return Column(
            children: [
              ListTile(
                leading: Icon(menu.icon, color: menu.color, size: 22),
                title: Text(menu.title, style: const TextStyle(fontSize: 15)),
                trailing: Icon(Icons.chevron_right, color: Colors.grey[400], size: 20),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                onTap: () => _handleMenuTap(menu.title),
              ),
              if (index < menus.length - 1)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Divider(height: 1, color: Colors.grey[200]),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }

  void _handleMenuTap(String title) {
    switch (title) {
      case '实名认证':
        Navigator.pushNamed(context, '/real-name');
        break;
      case '会员中心':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const MembershipPage()));
        break;
      case '晚安计划':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const GoodnightPlanPage()));
        break;
      case '邀请好友':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const InvitePage()));
        break;
      default:
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$title - 开发中'), duration: const Duration(seconds: 1)),
        );
    }
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final Color color;

  const _MenuItem(this.icon, this.title, this.color);
}
