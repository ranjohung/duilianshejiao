/// 场景常量
class SceneConstants {
  SceneConstants._();

  // ============ 场景阶段 ============
  static const String stageBeginner = 'beginner'; // 入门
  static const String stageIntermediate = 'intermediate'; // 进阶
  static const String stageAdvanced = 'advanced'; // 高级

  /// 场景阶段名称映射
  static const Map<String, String> stageNames = {
    stageBeginner: '入门',
    stageIntermediate: '进阶',
    stageAdvanced: '高级',
  };

  // ============ 教学风格 ============
  static const String styleGentle = 'gentle'; // 温和
  static const String styleStrict = 'strict'; // 严格
  static const String styleHumorous = 'humorous'; // 幽默
  static const String styleProfessional = 'professional'; // 专业

  /// 教学风格名称映射
  static const Map<String, String> styleNames = {
    styleGentle: '温和',
    styleStrict: '严格',
    styleHumorous: '幽默',
    styleProfessional: '专业',
  };

  // ============ 场景分类 ============
  static const String categoryWorkplace = 'workplace'; // 职场
  static const String categorySocial = 'social'; // 社交
  static const String categoryFamily = 'family'; // 家庭
  static const String categoryRelationship = 'relationship'; // 情感
  static const String categoryInterview = 'interview'; // 面试
  static const String categoryPublicSpeaking = 'public_speaking'; // 演讲

  /// 场景分类名称映射
  static const Map<String, String> categoryNames = {
    categoryWorkplace: '职场',
    categorySocial: '社交',
    categoryFamily: '家庭',
    categoryRelationship: '情感',
    categoryInterview: '面试',
    categoryPublicSpeaking: '演讲',
  };

  // ============ 难度范围 ============
  static const int difficultyMin = 1;
  static const int difficultyMax = 5;

  // ============ 真人挑战状态 ============
  static const String challengeUpcoming = 'upcoming'; // 即将开始
  static const String challengeOngoing = 'ongoing'; // 进行中
  static const String challengeEnded = 'ended'; // 已结束
}
