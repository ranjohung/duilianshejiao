/// API路由常量
/// 完整匹配PRD第21章API接口设计
class ApiRoutes {
  ApiRoutes._();

  static const String _prefix = '/api';

  // ============ 认证模块 ============
  static const String register = '$_prefix/auth/register';
  static const String login = '$_prefix/auth/login';
  static const String verifyRealName = '$_prefix/auth/verify-real-name';
  static const String refreshToken = '$_prefix/auth/refresh';
  static const String sendCode = '$_prefix/auth/send-code';

  // ============ 用户模块 ============
  static const String userProfile = '$_prefix/users/profile';
  static const String userUpdate = '$_prefix/users/profile';
  static const String userGrowth = '$_prefix/users/growth';

  // ============ 教练模块 ============
  static const String coachList = '$_prefix/coaches';
  static const String coachDetail = '$_prefix/coaches'; // + /:id
  static const String coachCustom = '$_prefix/coaches/custom';
  static const String coachPersonality =
      '$_prefix/coaches'; // + /:id/personality

  // ============ 场景模块 ============
  static const String sceneList = '$_prefix/scenes';
  static const String sceneDetail = '$_prefix/scenes'; // + /:id
  static const String sceneStart = '$_prefix/scenes'; // + /:id/start
  static const String sceneComplete = '$_prefix/scenes'; // + /:id/complete

  // ============ 训练模块 ============
  static const String trainingChat = '$_prefix/training/chat';
  static const String trainingRecords = '$_prefix/training/records';
  static const String trainingRecordDetail =
      '$_prefix/training/records'; // + /:id

  // ============ 成长模块 ============
  static const String growthRadar = '$_prefix/growth/radar';
  static const String growthProfile = '$_prefix/growth/profile';
  static const String growthProgress = '$_prefix/growth/progress';
  static const String growthWeeklyReport = '$_prefix/growth/weekly-report';
  static const String growthWeeklyProgress = '$_prefix/growth/weekly-progress';
  static const String growthProgressCurve = '$_prefix/growth/progress-curve';
  static const String growthMilestones = '$_prefix/growth/milestones';

  // ============ 签到模块 ============
  static const String checkIn = '$_prefix/check-in';
  static const String checkInStatus = '$_prefix/check-in/status';

  // ============ 晚安计划 ============
  static const String goodnightPlan = '$_prefix/goodnight/plan';
  static const String goodnightTrigger = '$_prefix/goodnight/trigger';

  // ============ 社交模块 ============
  static const String socialPosts = '$_prefix/social/posts';
  static const String socialComment = '$_prefix/social/posts'; // + /:id/comment
  static const String socialInvite = '$_prefix/social/invite';
  static const String socialLeaderboard = '$_prefix/social/leaderboard';

  // ============ 道具模块 ============
  static const String itemList = '$_prefix/items';
  static const String itemUse = '$_prefix/items/use';

  // ============ 会员模块 ============
  static const String membershipPlans = '$_prefix/membership/plans';
  static const String membershipPurchase = '$_prefix/membership/subscribe';
  static const String membershipStatus = '$_prefix/membership/status';
  static const String membershipComparison = '$_prefix/membership/comparison';

  // ============ 情绪日记 ============
  static const String emotionDiaries = '$_prefix/emotion-diaries';

  // ============ 学习卡片 ============
  static const String learningCards = '$_prefix/learning-cards';
  static const String learningCardCollect =
      '$_prefix/learning-cards'; // + /:id/collect

  // ============ 成就 ============
  static const String achievements = '$_prefix/achievements';

  // ============ 才艺 ============
  static const String talents = '$_prefix/talents';

  // ============ 真实挑战 ============
  static const String realChallenges = '$_prefix/real-challenges';
  static const String realChallengeComplete =
      '$_prefix/real-challenges'; // + /:id/complete
}
