/// 应用常量
class AppConstants {
  AppConstants._();

  // ============ 会员等级 ============
  static const int membershipFree = 0; // 免费用户
  static const int membershipBasic = 1; // 基础会员
  static const int membershipPremium = 2; // 高级会员
  static const int membershipVip = 3; // 尊享会员

  /// 会员等级名称映射
  static const Map<int, String> membershipLevelNames = {
    membershipFree: '免费用户',
    membershipBasic: '基础会员',
    membershipPremium: '高级会员',
    membershipVip: '尊享会员',
  };

  // ============ 训练模式 ============
  static const String trainingModeVoice = 'voice'; // 语音模式
  static const String trainingModeText = 'text'; // 文字模式

  // ============ 打卡类型 ============
  static const String checkInTypeTraining = 'training'; // 对练打卡
  static const String checkInTypeEmotion = 'emotion'; // 情绪日记打卡
  static const String checkInTypeLearning = 'learning'; // 学习打卡

  // ============ 情绪类型 ============
  static const int emotionHappy = 1; // 开心
  static const int emotionCalm = 2; // 平静
  static const int emotionAnxious = 3; // 焦虑
  static const int emotionDown = 4; // 低落
  static const int emotionAngry = 5; // 愤怒

  /// 情绪类型名称映射
  static const Map<int, String> emotionTypeNames = {
    emotionHappy: '开心',
    emotionCalm: '平静',
    emotionAnxious: '焦虑',
    emotionDown: '低落',
    emotionAngry: '愤怒',
  };

  // ============ 商品分类 ============
  static const String itemCategoryCoachSkin = 'coach_skin'; // 教练皮肤
  static const String itemCategoryScenePack = 'scene_pack'; // 场景包
  static const String itemCategoryTool = 'tool'; // 工具道具
}
