import 'package:json_annotation/json_annotation.dart';

part 'coach_model.g.dart';

@JsonSerializable()
class PersonalityConfig {
  final String decisionBasis;
  final String infoProcessing;
  final String lifeAttitude;

  PersonalityConfig({
    required this.decisionBasis,
    required this.infoProcessing,
    required this.lifeAttitude,
  });

  factory PersonalityConfig.fromJson(Map<String, dynamic> json) =>
      _$PersonalityConfigFromJson(json);
  Map<String, dynamic> toJson() => _$PersonalityConfigToJson(this);
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
  });

  factory CoachModel.fromJson(Map<String, dynamic> json) =>
      _$CoachModelFromJson(json);
  Map<String, dynamic> toJson() => _$CoachModelToJson(this);
}
