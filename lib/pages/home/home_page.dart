import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/check_in_model.dart';
import '../../network/services/check_in_service.dart';

/// Tab1 首页
/// 展示：个性化问候、教练在线状态、签到、推荐场景、训练记录、本周进度、晚安计划
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  final _checkInService = CheckInService();

  // 签到状态
  bool _todayCheckedIn = false;
  int _streakDays = 0;
  bool _checkInLoading = false;

  // 呼吸灯动画
  late final AnimationController _breathController;

  // 模拟数据
  final List<Map<String, String>> _recentTrainings = [
    {'scene': '初次见面的破冰对话', 'coach': '沈清欢', 'score': '85', 'time': '2小时前'},
    {'scene': '同事间的闲聊技巧', 'coach': '沈清欢', 'score': '72', 'time': '昨天'},
    {'scene': '表达赞美的艺术', 'coach': '沈清欢', 'score': '90', 'time': '2天前'},
  ];

  final List<Map<String, dynamic>> _recommendedScenes = [
    {'name': '聚会上的自我介绍', 'stage': '破冰期', 'difficulty': 1, 'duration': 10},
    {'name': '与陌生人的搭讪技巧', 'stage': '接触期', 'difficulty': 2, 'duration': 12},
  ];

  // 本周训练进度 (模拟)
  final int _weekTrainingCount = 5;
  final int _weekTrainingGoal = 7;

  @override
  void initState() {
    super.initState();
    _breathController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _loadCheckInStatus();
  }

  @override
  void dispose() {
    _breathController.dispose();
    super.dispose();
  }

  Future<void> _loadCheckInStatus() async {
    try {
      final res = await _checkInService.getCheckInStatus();
      if (res.isSuccess && res.data != null) {
        setState(() {
          _todayCheckedIn = res.data!.todayCheckedIn;
          _streakDays = res.data!.streakDays;
        });
      }
    } catch (_) {
      // 网络异常时保持默认值
    }
  }

  Future<void> _handleCheckIn() async {
    if (_todayCheckedIn || _checkInLoading) return;
    setState(() => _checkInLoading = true);
    try {
      final res = await _checkInService.checkIn();
      if (res.isSuccess) {
        setState(() {
          _todayCheckedIn = true;
          _streakDays = res.data?.streakDays ?? (_streakDays + 1);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('签到成功！获得${res.data?.rewardAmount ?? 1}张${res.data?.rewardType == "time_shuttle" ? "时空穿梭券" : "奖励"}'),
              backgroundColor: AppConfig.successColor,
            ),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('签到失败，请重试'), backgroundColor: AppConfig.dangerColor),
        );
      }
    } finally {
      setState(() => _checkInLoading = false);
    }
  }

  /// 根据时间段返回问候语
  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) return '早上好';
    if (hour >= 12 && hour < 18) return '下午好';
    return '晚上好';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadCheckInStatus,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            children: [
              _buildGreetingSection(),
              const SizedBox(height: 16),
              _buildCoachOnlineCard(),
              const SizedBox(height: 16),
              _buildCheckInButton(),
              const SizedBox(height: 20),
              _buildRecommendedScenes(),
              const SizedBox(height: 20),
              _buildRecentTrainings(),
              const SizedBox(height: 20),
              _buildWeeklyProgress(),
              const SizedBox(height: 20),
              _buildGoodnightPlanCard(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  /// 个性化问候 + 学员等级
  Widget _buildGreetingSection() {
    return Row(
      children: [
        const CircleAvatar(
          radius: 24,
          backgroundColor: AppConfig.primaryColor,
          child: Icon(Icons.person, color: Colors.white, size: 28),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$_greeting，学员',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppConfig.accentColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      '青铜学员',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppConfig.accentColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '0/100 积分',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () {},
          icon: const Icon(Icons.notifications_outlined),
          color: Colors.grey[600],
        ),
      ],
    );
  }

  /// 教练在线状态卡片（呼吸灯动画）
  Widget _buildCoachOnlineCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E3A5F), Color(0xFF2C5F8A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppConfig.primaryColor.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // 头像 + 呼吸灯
          Stack(
            children: [
              const CircleAvatar(
                radius: 28,
                backgroundColor: Colors.white24,
                child: Icon(Icons.auto_awesome, color: Colors.white, size: 28),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: FadeTransition(
                  opacity: _breathController,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: AppConfig.successColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '沈清欢',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  '在线 · 鼓励型教练',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/coach-list');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white24,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text('开始训练'),
          ),
        ],
      ),
    );
  }

  /// 签到大按钮
  Widget _buildCheckInButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _todayCheckedIn ? null : _handleCheckIn,
        style: ElevatedButton.styleFrom(
          backgroundColor: _todayCheckedIn ? Colors.grey[300] : AppConfig.accentColor,
          foregroundColor: _todayCheckedIn ? Colors.grey[600] : Colors.white,
          disabledBackgroundColor: Colors.grey[300],
          disabledForegroundColor: Colors.grey[600],
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          elevation: _todayCheckedIn ? 0 : 4,
        ),
        child: _checkInLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(_todayCheckedIn ? Icons.check_circle : Icons.calendar_today, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    _todayCheckedIn
                        ? '已签到  连续$_streakDays天'
                        : '立即签到  获得时空穿梭券',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
      ),
    );
  }

  /// 今日推荐场景卡片
  Widget _buildRecommendedScenes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '今日推荐',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/scene-select'),
              child: Text('更多', style: TextStyle(color: Colors.grey[600], fontSize: 14)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 130,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _recommendedScenes.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final scene = _recommendedScenes[index];
              return _buildSceneCard(scene);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSceneCard(Map<String, dynamic> scene) {
    return Container(
      width: 200,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            scene['name'] as String,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppConfig.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  scene['stage'] as String,
                  style: const TextStyle(fontSize: 11, color: AppConfig.primaryColor),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '⭐' * (scene['difficulty'] as int),
                style: const TextStyle(fontSize: 11),
              ),
            ],
          ),
          const Spacer(),
          Text(
            '${scene['duration']}分钟',
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  /// 最近训练记录
  Widget _buildRecentTrainings() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '最近训练',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            TextButton(
              onPressed: () {},
              child: Text('查看全部', style: TextStyle(color: Colors.grey[600], fontSize: 14)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ..._recentTrainings.map((t) => _buildTrainingItem(t)),
      ],
    );
  }

  Widget _buildTrainingItem(Map<String, String> training) {
    final score = int.tryParse(training['score'] ?? '0') ?? 0;
    final scoreColor = score >= 80
        ? AppConfig.successColor
        : score >= 60
            ? AppConfig.accentColor
            : AppConfig.dangerColor;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: scoreColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                '$score',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: scoreColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  training['scene'] ?? '',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '教练：${training['coach']}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
          ),
          Text(
            training['time'] ?? '',
            style: TextStyle(fontSize: 12, color: Colors.grey[400]),
          ),
        ],
      ),
    );
  }

  /// 本周训练进度
  Widget _buildWeeklyProgress() {
    final progress = (_weekTrainingGoal > 0) ? _weekTrainingCount / _weekTrainingGoal : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '本周训练进度',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              Text(
                '$_weekTrainingCount/$_weekTrainingGoal 次',
                style: const TextStyle(fontSize: 14, color: AppConfig.primaryColor, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 10,
              backgroundColor: Colors.grey[200],
              valueColor: const AlwaysStoppedAnimation<Color>(AppConfig.primaryColor),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            progress >= 1.0 ? '本周目标已达成！' : '再训练${_weekTrainingGoal - _weekTrainingCount}次即可达成目标',
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  /// 晚安计划卡片
  Widget _buildGoodnightPlanCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2D1B69), Color(0xFF5B3FA0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.nightlight_round, color: Color(0xFFF5D76E), size: 36),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '晚安计划',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  '每晚22:00 沈清欢陪你回顾今天',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text(
              '已开启',
              style: TextStyle(color: Colors.white, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
