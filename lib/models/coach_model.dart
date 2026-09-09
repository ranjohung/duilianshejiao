import 'package:json_annotation/json_annotation.dart';

part 'coach_model.g.dart';

@JsonSerializable()
class PersonalityConfig {
  final String socialEnergy;
  final String decisionBasis;
  final String infoProcessing;
  final String lifeAttitude;

  PersonalityConfig({
    this.socialEnergy = 'introvert',
    required this.decisionBasis,
    required this.infoProcessing,
    required this.lifeAttitude,
  });

  factory PersonalityConfig.fromJson(Map<String, dynamic> json) =>
      _$PersonalityConfigFromJson(json);
  Map<String, dynamic> toJson() => _$PersonalityConfigToJson(this);
}

/// 教练即时情绪状态；服务端未返回时由路由器使用中性默认值。
@JsonSerializable()
class CoachEmotionState {
  final int happiness;
  final int anxiety;
  final int fatigue;

  const CoachEmotionState({
    this.happiness = 70,
    this.anxiety = 30,
    this.fatigue = 20,
  });

  factory CoachEmotionState.fromJson(Map<String, dynamic> json) =>
      _$CoachEmotionStateFromJson(json);
  Map<String, dynamic> toJson() => _$CoachEmotionStateToJson(this);
}

/// 教练记忆片段，用于注入最近的用户偏好和训练摘要。
@JsonSerializable()
class CoachMemoryFragment {
  final String key;
  final String value;

  const CoachMemoryFragment({required this.key, required this.value});

  factory CoachMemoryFragment.fromJson(Map<String, dynamic> json) =>
      _$CoachMemoryFragmentFromJson(json);
  Map<String, dynamic> toJson() => _$CoachMemoryFragmentToJson(this);
}

@JsonSerializable()
class CoachModel {
  final String id;
  final String name;
  final String displayName;
  final String avatar;
  final String description;
  final String personality;
  final String expertise;
  final int level;
  final int experience;
  final List<String> tags;
  final PersonalityConfig? personalityConfig;
  final String? teachingStyleDisplayName;
  final String? systemPrompt;
  final String? occupation;
  final int? age;
  final CoachEmotionState? emotionState;
  final List<CoachMemoryFragment>? memoryFragments;

  CoachModel({
    required this.id,
    required this.name,
    required this.displayName,
    required this.avatar,
    required this.description,
    required this.personality,
    required this.expertise,
    required this.level,
    required this.experience,
    required this.tags,
    this.personalityConfig,
    this.teachingStyleDisplayName,
    this.systemPrompt,
    this.occupation,
    this.age,
    this.emotionState,
    this.memoryFragments,
  });

  factory CoachModel.fromJson(Map<String, dynamic> json) =>
      _$CoachModelFromJson(json);
  Map<String, dynamic> toJson() => _$CoachModelToJson(this);
}
