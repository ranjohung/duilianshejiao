import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/coach_model.dart';

/// LLM混合路由器
/// 根据PRD第3.2节的LLM混合引擎架构实现
///
/// 路由策略：
/// - 体验用户(1次) → DeepSeek
/// - 免费用户 → Ollama + 10%偶遇DeepSeek
/// - 日卡/周卡/月卡 → DeepSeek
/// - 年卡 → DeepSeek高优先级
/// - 健康检查失败 → 自动降级Ollama
class LlmRouter {
  static LlmRouter? _instance;
  LlmRouter._();

  static LlmRouter get instance => _instance ??= LlmRouter._();

  /// LLM后端类型
  static const String deepseek = 'deepseek';
  static const String ollama = 'ollama';

  /// DeepSeek健康状态
  bool _deepseekHealthy = true;
  DateTime _lastHealthCheck = DateTime.fromMillisecondsSinceEpoch(0);

  /// 根据会员等级选择LLM后端
  /// 返回 'deepseek' 或 'ollama'
  String route({required String memberLevel}) {
    // 先检查DeepSeek健康状态
    _checkHealth();

    if (!_deepseekHealthy) {
      // DeepSeek不可用，自动降级到Ollama
      return ollama;
    }

    switch (memberLevel) {
      case 'experience':
        // 体验用户：使用DeepSeek（只有1次机会）
        return deepseek;
      case 'free':
        // 免费用户：90%走Ollama，10%偶遇DeepSeek
        final random = DateTime.now().millisecond % 10;
        return random == 0 ? deepseek : ollama;
      case 'daily':
      case 'weekly':
      case 'monthly':
        // 付费会员：使用DeepSeek
        return deepseek;
      case 'yearly':
        // 年卡：DeepSeek高优先级
        return deepseek;
      default:
        return ollama;
    }
  }

  /// 健康检查（每60秒检查一次）
  void _checkHealth() {
    final now = DateTime.now();
    if (now.difference(_lastHealthCheck).inSeconds < 60) return;
    _lastHealthCheck = now;

    // 异步检查DeepSeek健康状态
    _doHealthCheck();
  }

  Future<void> _doHealthCheck() async {
    try {
      final dio = Dio();
      dio.options.connectTimeout = const Duration(seconds: 3);
      final res = await dio.get('${ApiConfig.deepseekBaseUrl}/health');
      _deepseekHealthy = res.statusCode == 200;
    } catch (_) {
      _deepseekHealthy = false;
    }
  }

  /// 构建系统提示词
  /// 包含：教学风格+性格维度+当前情绪+记忆片段+行为约束+场景
  String buildSystemPrompt({
    required CoachModel coach,
    required String sceneDescription,
    required String? previousContext,
  }) {
    final buffer = StringBuffer();

    // 基本人格设定
    buffer.writeln(
      '你是${coach.displayName}，一位${coach.teachingStyleDisplayName}风格的AI社交训练教练。',
    );

    // 职业和年龄
    if (coach.occupation != null) {
      buffer.writeln('你的职业是${coach.occupation}，年龄${coach.age ?? 25}岁。');
    }

    // 性格维度
    final p = coach.personalityConfig;
    buffer.writeln('你的性格特点：');
    buffer.writeln('- 社交能量：${p.socialEnergy == 'extrovert' ? '外向' : '内向'}');
    buffer.writeln('- 信息处理：${p.infoProcessing == 'sensing' ? '实感' : '直觉'}');
    buffer.writeln('- 决策依据：${p.decisionBasis == 'feeling' ? '感性' : '理性'}');
    buffer.writeln('- 生活态度：${p.lifeAttitude == 'planning' ? '计划' : '随性'}');

    // 当前情绪状态
    final e = coach.emotionState;
    buffer.writeln(
      '当前情绪：愉悦度${e.happiness}/100，焦虑度${e.anxiety}/100，疲惫度${e.fatigue}/100。',
    );

    // 记忆片段
    if (coach.memoryFragments.isNotEmpty) {
      buffer.writeln('你记得关于用户的关键信息：');
      for (final m in coach.memoryFragments) {
        buffer.writeln('- ${m.key}: ${m.value}');
      }
    }

    // 场景描述
    buffer.writeln('当前训练场景：$sceneDescription');

    // 行为约束
    buffer.writeln('行为约束：');
    buffer.writeln('1. 保持人格一致性，不要OOC（out of character）');
    buffer.writeln('2. 给出建设性的反馈，帮助用户提升社交能力');
    buffer.writeln('3. 不提供医疗建议，遇到严重心理问题建议寻求专业帮助');
    buffer.writeln('4. 不涉及政治、宗教等敏感话题');

    // 上下文
    if (previousContext != null && previousContext.isNotEmpty) {
      buffer.writeln('之前的对话上下文：$previousContext');
    }

    return buffer.toString();
  }

  /// 发送LLM对话请求
  /// 根据路由选择对应的LLM后端
  Future<String> chat({
    required String memberLevel,
    required String systemPrompt,
    required String userMessage,
    required List<Map<String, String>> history,
  }) async {
    final backend = route(memberLevel: memberLevel);

    try {
      if (backend == deepseek) {
        return await _chatWithDeepseek(systemPrompt, userMessage, history);
      } else {
        return await _chatWithOllama(systemPrompt, userMessage, history);
      }
    } catch (_) {
      // 当前后端失败，尝试降级
      if (backend == deepseek) {
        _deepseekHealthy = false;
        return await _chatWithOllama(systemPrompt, userMessage, history);
      }
      rethrow;
    }
  }

  /// DeepSeek API调用
  Future<String> _chatWithDeepseek(
    String systemPrompt,
    String userMessage,
    List<Map<String, String>> history,
  ) async {
    final dio = Dio();
    final messages = <Map<String, String>>[
      {'role': 'system', 'content': systemPrompt},
      ...history,
      {'role': 'user', 'content': userMessage},
    ];

    final res = await dio.post(
      '${ApiConfig.deepseekBaseUrl}/chat/completions',
      options: Options(
        headers: {
          'Authorization': 'Bearer ${ApiConfig.deepseekApiKey}',
          'Content-Type': 'application/json',
        },
      ),
      data: {
        'model': 'deepseek-chat',
        'messages': messages,
        'max_tokens': 1024,
        'temperature': 0.7,
      },
    );

    return res.data['choices'][0]['message']['content'] as String;
  }

  /// Ollama本地调用
  Future<String> _chatWithOllama(
    String systemPrompt,
    String userMessage,
    List<Map<String, String>> history,
  ) async {
    final dio = Dio();
    dio.options.connectTimeout = const Duration(seconds: 30);

    final messages = <Map<String, String>>[
      {'role': 'system', 'content': systemPrompt},
      ...history,
      {'role': 'user', 'content': userMessage},
    ];

    final res = await dio.post(
      '${ApiConfig.ollamaBaseUrl}/api/chat',
      data: {'model': 'qwen2.5:14b', 'messages': messages, 'stream': false},
    );

    return res.data['message']['content'] as String;
  }
}
