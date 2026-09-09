// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scene_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SceneModel _$SceneModelFromJson(Map<String, dynamic> json) => SceneModel(
      id: json['id'] as String,
      name: json['name'] as String,
      stage: json['stage'] as String,
      difficulty: json['difficulty'] as String,
      description: json['description'] as String,
      rounds: (json['rounds'] as num).toInt(),
      npcName: json['npcName'] as String,
      npcAvatar: json['npcAvatar'] as String,
      opening: json['opening'] as String,
      isLocked: json['isLocked'] as bool? ?? false,
      stageDisplayName: json['stageDisplayName'] as String?,
      difficultyText: json['difficultyText'] as String?,
      estimatedDuration: (json['estimatedDuration'] as num?)?.toInt() ?? 5,
      teachingPoint: json['teachingPoint'] as String?,
      completionRate: (json['completionRate'] as num?)?.toDouble() ?? 0,
      unlockDescription: json['unlockDescription'] as String?,
      isUnlocked: json['isUnlocked'] as bool? ?? true,
      unlockReason: json['unlockReason'] as String?,
      completed: json['completed'] as bool?,
    );

Map<String, dynamic> _$SceneModelToJson(SceneModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'stage': instance.stage,
      'difficulty': instance.difficulty,
      'description': instance.description,
      'rounds': instance.rounds,
      'npcName': instance.npcName,
      'npcAvatar': instance.npcAvatar,
      'opening': instance.opening,
      'isLocked': instance.isLocked,
      'stageDisplayName': instance.stageDisplayName,
      'difficultyText': instance.difficultyText,
      'estimatedDuration': instance.estimatedDuration,
      'teachingPoint': instance.teachingPoint,
      'completionRate': instance.completionRate,
      'unlockDescription': instance.unlockDescription,
      'isUnlocked': instance.isUnlocked,
      'unlockReason': instance.unlockReason,
      'completed': instance.completed,
    };
