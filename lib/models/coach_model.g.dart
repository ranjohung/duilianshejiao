// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'coach_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PersonalityConfig _$PersonalityConfigFromJson(Map<String, dynamic> json) =>
    PersonalityConfig(
      socialEnergy: json['socialEnergy'] as String? ?? 'introvert',
      decisionBasis: json['decisionBasis'] as String,
      infoProcessing: json['infoProcessing'] as String,
      lifeAttitude: json['lifeAttitude'] as String,
    );

Map<String, dynamic> _$PersonalityConfigToJson(PersonalityConfig instance) =>
    <String, dynamic>{
      'socialEnergy': instance.socialEnergy,
      'decisionBasis': instance.decisionBasis,
      'infoProcessing': instance.infoProcessing,
      'lifeAttitude': instance.lifeAttitude,
    };

CoachEmotionState _$CoachEmotionStateFromJson(Map<String, dynamic> json) =>
    CoachEmotionState(
      happiness: (json['happiness'] as num?)?.toInt() ?? 70,
      anxiety: (json['anxiety'] as num?)?.toInt() ?? 30,
      fatigue: (json['fatigue'] as num?)?.toInt() ?? 20,
    );

Map<String, dynamic> _$CoachEmotionStateToJson(CoachEmotionState instance) =>
    <String, dynamic>{
      'happiness': instance.happiness,
      'anxiety': instance.anxiety,
      'fatigue': instance.fatigue,
    };

CoachMemoryFragment _$CoachMemoryFragmentFromJson(Map<String, dynamic> json) =>
    CoachMemoryFragment(
      key: json['key'] as String,
      value: json['value'] as String,
    );

Map<String, dynamic> _$CoachMemoryFragmentToJson(
        CoachMemoryFragment instance) =>
    <String, dynamic>{
      'key': instance.key,
      'value': instance.value,
    };

CoachModel _$CoachModelFromJson(Map<String, dynamic> json) => CoachModel(
      id: json['id'] as String,
      name: json['name'] as String,
      displayName: json['displayName'] as String,
      avatar: json['avatar'] as String,
      description: json['description'] as String,
      personality: json['personality'] as String,
      expertise: json['expertise'] as String,
      level: (json['level'] as num).toInt(),
      experience: (json['experience'] as num).toInt(),
      tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),
      personalityConfig: json['personalityConfig'] == null
          ? null
          : PersonalityConfig.fromJson(
              json['personalityConfig'] as Map<String, dynamic>),
      teachingStyleDisplayName: json['teachingStyleDisplayName'] as String?,
      systemPrompt: json['systemPrompt'] as String?,
      occupation: json['occupation'] as String?,
      age: (json['age'] as num?)?.toInt(),
      emotionState: json['emotionState'] == null
          ? null
          : CoachEmotionState.fromJson(
              json['emotionState'] as Map<String, dynamic>),
      memoryFragments: (json['memoryFragments'] as List<dynamic>?)
          ?.map((e) => CoachMemoryFragment.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$CoachModelToJson(CoachModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'displayName': instance.displayName,
      'avatar': instance.avatar,
      'description': instance.description,
      'personality': instance.personality,
      'expertise': instance.expertise,
      'level': instance.level,
      'experience': instance.experience,
      'tags': instance.tags,
      'personalityConfig': instance.personalityConfig,
      'teachingStyleDisplayName': instance.teachingStyleDisplayName,
      'systemPrompt': instance.systemPrompt,
      'occupation': instance.occupation,
      'age': instance.age,
      'emotionState': instance.emotionState,
      'memoryFragments': instance.memoryFragments,
    };
