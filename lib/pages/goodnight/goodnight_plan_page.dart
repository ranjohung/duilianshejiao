import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../network/services/goodnight_service.dart';

/// 晚安计划设置页面
/// 展示：教练选择、推送时间选择、开关
class GoodnightPlanPage extends StatefulWidget {
  const GoodnightPlanPage({super.key});

  @override
  State<GoodnightPlanPage> createState() => _GoodnightPlanPageState();
}

class _GoodnightPlanPageState extends State<GoodnightPlanPage> {
  final _goodnightService = GoodnightService();

  bool _enabled = true;
  String _selectedCoachId = '1';
  String _selectedCoachName = '沈清欢';
  TimeOfDay _pushTime = const TimeOfDay(hour: 22, minute: 0);
  bool _loading = true;
  bool _saving = false;

  // 模拟教练列表
  final List<Map<String, String>> _coaches = [
    {'id': '1', 'name': '沈清欢', 'style': '鼓励型教练'},
    {'id': '2', 'name': '顾言之', 'style': '引导型教练'},
    {'id': '3', 'name': '苏晚棠', 'style': '温柔型教练'},
  ];

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    try {
      final res = await _goodnightService.getPlan();
      if (res.isSuccess && res.data != null) {
        final plan = res.data!;
        setState(() {
          _enabled = plan.isActive;
          _selectedCoachId = plan.coachId;
          _pushTime = TimeOfDay(
            hour: plan.scheduledTime.hour,
            minute: plan.scheduledTime.minute,
          );
          _loading = false;
        });
        // 更新教练名
        final coach = _coaches.where((c) => c['id'] == _selectedCoachId).firstOrNull;
        if (coach != null) {
          _selectedCoachName = coach['name']!;
        }
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _savePlan() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      final pushTimeStr =
          '${_pushTime.hour.toString().padLeft(2, '0')}:${_pushTime.minute.toString().padLeft(2, '0')}';
      final res = await _goodnightService.setPlan(
        coachId: _selectedCoachId,
        pushTime: pushTimeStr,
        enabled: _enabled,
      );
      if (res.isSuccess && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_enabled ? '晚安计划已保存' : '晚安计划已关闭'),
            backgroundColor: AppConfig.successColor,
          ),
        );
        Navigator.pop(context);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('保存失败'), backgroundColor: AppConfig.dangerColor),
        );
      }
    } finally {
      setState(() => _saving = false);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _pushTime,
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppConfig.primaryColor,
            onPrimary: Colors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _pushTime = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('晚安计划'),
        backgroundColor: const Color(0xFF2D1B69),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              children: [
                _buildHeaderCard(),
                const SizedBox(height: 20),
                _buildCoachSelector(),
                const SizedBox(height: 16),
                _buildTimeSelector(),
                const SizedBox(height: 16),
                _buildEnabledSwitch(),
                const SizedBox(height: 32),
                _buildSaveButton(),
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  /// 顶部说明卡片
  Widget _buildHeaderCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2D1B69), Color(0xFF5B3FA0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF5B3FA0).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.nightlight_round, color: Color(0xFFF5D76E), size: 30),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '晚安计划',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  '每晚教练陪你回顾今天，温柔道晚安',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 教练选择
  Widget _buildCoachSelector() {
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
          const Text(
            '选择教练',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          ..._coaches.map((coach) => _buildCoachOption(coach)),
        ],
      ),
    );
  }

  Widget _buildCoachOption(Map<String, String> coach) {
    final selected = _selectedCoachId == coach['id'];
    return InkWell(
      onTap: () => setState(() {
        _selectedCoachId = coach['id']!;
        _selectedCoachName = coach['name']!;
      }),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppConfig.primaryColor.withValues(alpha: 0.06) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppConfig.primaryColor : Colors.grey[200]!,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: selected ? AppConfig.primaryColor.withValues(alpha: 0.15) : Colors.grey[200],
              child: Icon(
                Icons.auto_awesome,
                color: selected ? AppConfig.primaryColor : Colors.grey[500],
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    coach['name']!,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                      color: selected ? AppConfig.primaryColor : Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    coach['style']!,
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  ),
                ],
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle, color: AppConfig.primaryColor, size: 22),
          ],
        ),
      ),
    );
  }

  /// 推送时间选择
  Widget _buildTimeSelector() {
    final timeStr = '${_pushTime.hour.toString().padLeft(2, '0')}:${_pushTime.minute.toString().padLeft(2, '0')}';
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
          const Text(
            '推送时间',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: _pickTime,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF5B3FA0).withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF5B3FA0).withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.access_time, color: Color(0xFF5B3FA0), size: 22),
                  const SizedBox(width: 12),
                  Text(
                    '每晚 $timeStr',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF5B3FA0),
                    ),
                  ),
                  const Spacer(),
                  Icon(Icons.chevron_right, color: Colors.grey[400], size: 22),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '建议在21:00-23:00之间设置，教练将在你入睡前温柔道晚安',
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  /// 开关
  Widget _buildEnabledSwitch() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: SwitchListTile(
        title: const Text('启用晚安计划', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        subtitle: Text(
          _enabled ? '$_selectedCoachName 每晚陪你道晚安' : '晚安计划已暂停',
          style: TextStyle(fontSize: 13, color: _enabled ? AppConfig.successColor : Colors.grey[500]),
        ),
        value: _enabled,
        activeColor: const Color(0xFF5B3FA0),
        onChanged: (val) => setState(() => _enabled = val),
        contentPadding: EdgeInsets.zero,
      ),
    );
  }

  /// 保存按钮
  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _saving ? null : _savePlan,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF5B3FA0),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
          elevation: 4,
        ),
        child: _saving
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Text('保存设置', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ),
    );
  }
}
