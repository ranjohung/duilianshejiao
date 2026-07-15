import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/membership_model.dart';
import '../../network/services/membership_service.dart';

/// 会员中心页面
/// 展示：会员权益对比表、当前会员状态、购买按钮
class MembershipPage extends StatefulWidget {
  const MembershipPage({super.key});

  @override
  State<MembershipPage> createState() => _MembershipPageState();
}

class _MembershipPageState extends State<MembershipPage> {
  final _membershipService = MembershipService();

  String _currentLevel = 'free';
  bool _loading = true;
  bool _purchasing = false;

  // 可购买方案（排除体验版和免费版）
  List<MembershipPlan> get _purchasablePlans =>
      MembershipPlan.allPlans.where((p) => p.price > 0).toList();

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    try {
      final res = await _membershipService.getStatus();
      if (res.isSuccess && res.data != null) {
        setState(() {
          _currentLevel = res.data!['level'] ?? 'free';
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _handlePurchase(MembershipPlan plan) async {
    if (_purchasing) return;
    setState(() => _purchasing = true);
    try {
      final res = await _membershipService.purchase(
        level: plan.level,
        paymentMethod: 'wechat',
      );
      if (res.isSuccess) {
        setState(() => _currentLevel = plan.level);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('开通${plan.label}成功！'),
              backgroundColor: AppConfig.successColor,
            ),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('购买失败，请重试'), backgroundColor: AppConfig.dangerColor),
        );
      }
    } finally {
      setState(() => _purchasing = false);
    }
  }

  void _showPaymentSheet(MembershipPlan plan) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '开通${plan.label}',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(ctx),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              plan.priceText,
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: AppConfig.accentColor,
              ),
            ),
            const SizedBox(height: 16),
            _buildFeatureList(plan),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _handlePurchase(plan);
                },
                icon: const Icon(Icons.payment, color: Colors.white),
                label: const Text('微信支付', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF07C160),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _membershipService.purchase(level: plan.level, paymentMethod: 'alipay');
                  _handlePurchase(plan);
                },
                icon: const Icon(Icons.account_balance_wallet, color: Colors.white),
                label: const Text('支付宝支付', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1677FF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureList(MembershipPlan plan) {
    final features = [
      if (plan.features.llmEngine.contains('deepseek')) 'DeepSeek引擎',
      if (plan.features.weeklyTrainings == -1) '无限训练',
      if (plan.features.weeklyTrainings > 0 && plan.features.weeklyTrainings != -1) '每周${plan.features.weeklyTrainings}次训练',
      if (plan.features.voiceTraining) '语音训练',
      if (plan.features.highDifficulty) '高难度关卡',
      if (plan.features.weeklyShuttles > 0) '${plan.features.weeklyShuttles}张穿梭券/周',
      if (plan.features.weeklyDoublePoints > 0) '${plan.features.weeklyDoublePoints}张双倍积分/周',
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: features.map((f) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: AppConfig.primaryColor.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(f, style: const TextStyle(fontSize: 13, color: AppConfig.primaryColor)),
      )).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('会员中心'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                _buildCurrentStatusCard(),
                const SizedBox(height: 20),
                _buildComparisonTable(),
                const SizedBox(height: 20),
                _buildPlanCards(),
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  /// 当前会员状态卡片
  Widget _buildCurrentStatusCard() {
    final plan = MembershipPlan.findByLevel(_currentLevel);
    final isActive = _currentLevel != 'free' && _currentLevel != 'experience';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isActive
              ? [const Color(0xFFF5A623), const Color(0xFFF7C948)]
              : [const Color(0xFF1E3A5F), const Color(0xFF2C5F8A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isActive ? AppConfig.accentColor : AppConfig.primaryColor).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.card_membership, color: Colors.white, size: 32),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  plan?.label ?? '免费版',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isActive ? '会员权益已生效' : '升级会员解锁更多权益',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 权益对比表
  Widget _buildComparisonTable() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '权益对比',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(AppConfig.primaryColor.withValues(alpha: 0.06)),
                headingTextStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppConfig.primaryColor),
                dataTextStyle: TextStyle(fontSize: 12, color: Colors.grey[700]),
                columnSpacing: 16,
                horizontalMargin: 12,
                columns: MembershipComparison.headers.map((h) => DataColumn(
                  label: Text(h, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                )).toList(),
                rows: MembershipComparison.rows.map((row) => DataRow(
                  cells: [
                    DataCell(Text(row.feature, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12))),
                    ...row.values.map((v) => DataCell(Text(v, style: TextStyle(
                      fontSize: 11,
                      color: v.contains('✅') ? AppConfig.successColor : (v.contains('❌') ? Colors.grey : Colors.grey[700]!),
                    )))),
                  ],
                )).toList(),
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// 会员方案卡片列表
  Widget _buildPlanCards() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '选择方案',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ..._purchasablePlans.map((plan) => _buildPlanCard(plan)),
      ],
    );
  }

  Widget _buildPlanCard(MembershipPlan plan) {
    final isCurrent = _currentLevel == plan.level;
    final isPopular = plan.level == 'monthly';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrent
              ? AppConfig.accentColor
              : isPopular
                  ? AppConfig.primaryColor
                  : Colors.grey[200]!,
          width: isCurrent || isPopular ? 2 : 1,
        ),
        boxShadow: isPopular
            ? [BoxShadow(color: AppConfig.primaryColor.withValues(alpha: 0.1), blurRadius: 8, offset: const Offset(0, 2))]
            : null,
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          plan.label,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        if (isPopular) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppConfig.accentColor,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              '推荐',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                        if (isCurrent) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppConfig.successColor,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              '当前',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      plan.features.weeklyTrainingsText,
                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    plan.price == 0 ? '免费' : '¥${plan.price}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppConfig.accentColor,
                    ),
                  ),
                  Text(
                    plan.duration > 0 ? '/${plan.duration == 1 ? '日' : plan.duration == 7 ? '周' : plan.duration == 30 ? '月' : '年'}' : '',
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  ),
                ],
              ),
            ],
          ),
          if (!isCurrent) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: _purchasing ? null : () => _showPaymentSheet(plan),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isPopular ? AppConfig.primaryColor : AppConfig.accentColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
                ),
                child: _purchasing
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('立即开通', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
