import 'package:json_annotation/json_annotation.dart';

part 'coach_model.g.dart';

/// AI教练数据模型
/// 对应数据库 coaches 表
@JsonSerializable()
class CoachModel {
  final String id;
  final String name;
  final String? avatar;
  final String teachingStyle; // 教学风格：encouraging/supportive/challenging/analytical
  final PersonalityConfig personalityConfig; // 性格配置
  final EmotionState emotionState; // 情绪状态
  final List<MemoryFragment> memoryFragments; // 记忆片段
  final String? voiceId; // TTS语音ID
  final String? spineAsset; // Spine动画资源路径
  final String? occupation; // 职业
  final int? age; // 年龄
  final bool isPreset; // 是否预设教练
  final String? customizedName; // 用户自定义称呼
  final String? systemPrompt; // 系统提示词（动态生成）
  final DateTime createdAt;

  CoachModel({
    required this.id,
    required this.name,
    this.avatar,
    required this.teachingStyle,
    required this.personalityConfig,
    required this.emotionState,
    this.memoryFragments = const [],
    this.voiceId,
    this.spineAsset,
    this.occupation,
    this.age,
    this.isPreset = false,
    this.customizedName,
    this.systemPrompt,
    required this.createdAt,
  });

  /// 教学风格显示名
  String get teachingStyleDisplayName {
    const map = {
      'encouraging': '鼓励型',
      'supportive': '支持型',
      'challenging': '挑战型',
      'analytical': '分析型',
    };
    return map[teachingStyle] ?? '鼓励型';
  }

  /// 显示名称（优先自定义称呼）
  String get displayName => customizedName ?? name;

  factory CoachModel.fromJson(Map<String, dynamic> json) =>
      _$CoachModelFromJson(json);
  Map<String, dynamic> toJson() => _$CoachModelToJson(this);
}

/// 性格配置（4组维度）
@JsonSerializable()
class PersonalityConfig {
  final String socialEnergy; // 社交能量：extrovert/introvert
  final String infoProcessing; // 信息处理：sensing/intuition
  final String decisionBasis; // 决策依据：feeling/thinking
  final String lifeAttitude; // 生活态度：planning/spontaneous

  PersonalityConfig({
    this.socialEnergy = 'extrovert',
    this.infoProcessing = 'sensing',
    this.decisionBasis = 'feeling',
    this.lifeAttitude = 'planning',
  });

  factory PersonalityConfig.fromJson(Map<String, dynamic> json) =>
      _$PersonalityConfigFromJson(json);
  Map<String, dynamic> toJson() => _$PersonalityConfigToJson(this);
}

/// 情绪状态
@JsonSerializable()
class EmotionState {
  final int happiness; // 愉悦度 0-100
  final int anxiety;   // 焦虑度 0-100
  final int fatigue;   // 疲惫度 0-100

  EmotionState({
    this.happiness = 70,
    this.anxiety = 20,
    this.fatigue = 10,
  });

  /// 主要情绪
  String get primaryEmotion {
    if (happiness >= anxiety && happiness >= fatigue) return 'happy';
    if (anxiety >= happiness && anxiety >= fatigue) return 'anxious';
    return 'tired';
  }

  factory EmotionState.fromJson(Map<String, dynamic> json) =>
      _$EmotionStateFromJson(json);
  Map<String, dynamic> toJson() => _$EmotionStateToJson(this);
}

/// 记忆片段
@JsonSerializable()
class MemoryFragment {
  final String key;
  final String value;
  final DateTime timestamp;

  MemoryFragment({
    required this.key,
    required this.value,
    required this.timestamp,
  });

  factory MemoryFragment.fromJson(Map<String, dynamic> json) =>
      _$MemoryFragmentFromJson(json);
  Map<String, dynamic> toJson() => _$MemoryFragmentToJson(this);
}
