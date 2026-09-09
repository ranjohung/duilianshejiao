import '../models/coach_model.dart';
import '../models/scene_model.dart';

/// 仅用于 DEMO_MODE 的本地演示数据。
/// 生产构建不会读取这里的数据，也不会绕过真实鉴权或业务接口。
class DemoData {
  DemoData._();

  static final CoachModel defaultCoach = CoachModel(
    id: 'demo-coach-01',
    name: '沈清欢',
    displayName: '沈清欢',
    avatar: '',
    description: '温柔而有耐心的社交教练',
    personality: '温柔鼓励型',
    expertise: '破冰、倾听与表达',
    level: 3,
    experience: 1280,
    tags: const ['温柔', '耐心', '共情'],
    personalityConfig: PersonalityConfig(
      decisionBasis: 'feeling',
      infoProcessing: 'sensing',
      lifeAttitude: 'spontaneous',
    ),
    teachingStyleDisplayName: '温柔鼓励型',
  );

  static final List<CoachModel> coaches = [
    defaultCoach,
    CoachModel(
      id: 'demo-coach-02',
      name: '陆北辰',
      displayName: '陆北辰',
      avatar: '',
      description: '帮助你拆解沟通逻辑，建立清晰表达',
      personality: '理性分析型',
      expertise: '职场沟通、谈判与汇报',
      level: 4,
      experience: 1860,
      tags: const ['理性', '结构化', '直接'],
      personalityConfig: PersonalityConfig(
        decisionBasis: 'thinking',
        infoProcessing: 'sensing',
        lifeAttitude: 'planned',
      ),
      teachingStyleDisplayName: '理性分析型',
    ),
    CoachModel(
      id: 'demo-coach-03',
      name: '顾星河',
      displayName: '顾星河',
      avatar: '',
      description: '在轻松氛围中练习自然、有趣的对话',
      personality: '轻松幽默型',
      expertise: '幽默表达、话题推进',
      level: 2,
      experience: 760,
      tags: const ['幽默', '轻松', '活泼'],
      personalityConfig: PersonalityConfig(
        decisionBasis: 'feeling',
        infoProcessing: 'sensing',
        lifeAttitude: 'spontaneous',
      ),
      teachingStyleDisplayName: '轻松幽默型',
    ),
    CoachModel(
      id: 'demo-coach-04',
      name: '苏念',
      displayName: '苏念',
      avatar: '',
      description: '细腻理解你的情绪，陪你练习真诚表达',
      personality: '细腻共情型',
      expertise: '情绪沟通、关系维护',
      level: 3,
      experience: 1120,
      tags: const ['细腻', '共情', '真诚'],
      personalityConfig: PersonalityConfig(
        decisionBasis: 'feeling',
        infoProcessing: 'sensing',
        lifeAttitude: 'planned',
      ),
      teachingStyleDisplayName: '细腻共情型',
    ),
  ];

  static final List<SceneModel> scenes = [
    _scene(
      id: 'demo-scene-01',
      name: '初次见面',
      stage: '破冰入门',
      description: '学会在陌生场合自然打招呼和自我介绍',
      difficulty: '入门',
    ),
    _scene(
      id: 'demo-scene-02',
      name: '兴趣破冰',
      stage: '破冰入门',
      description: '找到共同话题，打开一段舒服的对话',
      difficulty: '入门',
    ),
    _scene(
      id: 'demo-scene-03',
      name: '同事闲聊',
      stage: '日常沟通',
      description: '在茶水间和同事自然地聊上几句',
      difficulty: '进阶',
    ),
    _scene(
      id: 'demo-scene-04',
      name: '加薪谈判',
      stage: '职场表达',
      description: '有理有据地表达价值、诉求与底线',
      difficulty: '挑战',
    ),
  ];

  static List<StageGroup> get groupedScenes => [
        StageGroup(
          stage: '破冰入门',
          unlocked: true,
          scenes: scenes.take(2).toList(),
        ),
        StageGroup(
          stage: '日常沟通',
          unlocked: false,
          scenes: [scenes[2]],
        ),
        StageGroup(
          stage: '职场表达',
          unlocked: false,
          scenes: [scenes[3]],
        ),
      ];

  static SceneModel _scene({
    required String id,
    required String name,
    required String stage,
    required String description,
    required String difficulty,
  }) {
    return SceneModel(
      id: id,
      name: name,
      stage: stage,
      difficulty: difficulty,
      description: description,
      rounds: 3,
      npcName: '练习伙伴',
      npcAvatar: '',
      opening: '你好，很高兴认识你。我们从一个轻松的话题开始吧。',
      stageDisplayName: stage,
      difficultyText: difficulty,
      estimatedDuration: 5,
      teachingPoint: '先回应对方，再补充自己的信息，最后抛出一个开放问题。',
      completionRate: 0,
      isUnlocked: true,
    );
  }

  static Map<String, dynamic> startTraining(String sceneId) {
    final scene = scenes.firstWhere(
      (item) => item.id == sceneId,
      orElse: () => scenes.first,
    );
    return {
      'sessionId': 'demo-session-${DateTime.now().millisecondsSinceEpoch}',
      'currentRound': 1,
      'totalRounds': scene.rounds,
      'currentScore': 0,
      'remainingTimeTravel': 1,
      'canUseHint': true,
      'message': scene.opening,
      'options': const [
        '你好，我是小林，很高兴认识你。',
        '你好，你平时喜欢做什么？',
        '你好，今天过得怎么样？',
      ],
    };
  }

  static Map<String, dynamic> sendMessage({
    required int round,
    required String message,
  }) {
    final finished = round >= 3;
    return {
      'currentRound': finished ? 3 : round + 1,
      'feedback': {
        'content': message.contains('你好') ? '开场自然，语气让人感到舒服。' : '回应清晰，可以继续接住对方的信息。',
        'score_delta': finished ? 12 : 10,
        'tip': '记得在回应后留下一个让对方容易回答的问题。',
      },
      if (!finished) 'message': '很好，我们继续。你可以顺着对方刚才提到的内容展开。',
      if (!finished)
        'options': const [
          '听起来很有意思，你最喜欢哪一部分？',
          '我也有类似的经历，可以和你分享吗？',
          '原来如此，你最近还在尝试什么新东西？',
        ],
      'isFinished': finished,
    };
  }

  static Map<String, dynamic> endTraining() => {
        'score': 82,
        'starRating': 3,
        'coachName': defaultCoach.displayName,
        'coachComment': '你的回应很自然，也有主动了解对方的意识。下一步可以练习把问题问得更具体，让对话更有来回。',
        'points': 15,
        'dimensionScores': const {
          'communication': 0.82,
          'expression': 0.78,
          'empathy': 0.86,
          'emotionControl': 0.80,
          'adaptability': 0.76,
        },
      };
}
