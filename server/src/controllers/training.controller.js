const Coach = require('../models/Coach');
const Scene = require('../models/Scene');
const TrainingRecord = require('../models/TrainingRecord');
const User = require('../models/User');
const { chatStream, chat, buildSystemPrompt } = require('../services/llmRouter');
const { successResponse, errorResponse } = require('../utils/response');
const presetScenes = require('../data/presetScenes');

// 内存中的活跃训练会话（生产环境应使用Redis）
const activeSessions = new Map();

/**
 * 开始训练
 * 选教练 + 选场景 → 初始化对话 → 返回第一条教练消息
 */
exports.startTraining = async (req, res) => {
  try {
    const { coachId, sceneId } = req.body;
    const userId = req.user.id;

    if (!coachId) return errorResponse(res, 400, '请选择教练');

    // 加载教练完整信息
    const coach = await Coach.getFullProfile(coachId);
    if (!coach) return errorResponse(res, 404, '教练不存在');

    // 加载场景信息（可选）
    let scene = null;
    if (sceneId) {
      scene = await Scene.findById(sceneId);
      if (scene) {
        // 解析场景的JSON字段
        if (scene.teaching_points && typeof scene.teaching_points === 'string') {
          try { scene.teaching_points = JSON.parse(scene.teaching_points); } catch {}
        }
      }
    }

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(coach, scene, coach.emotion_state);

    // 生成会话ID
    const sessionId = `train_${userId}_${coachId}_${Date.now()}`;

    // 构建开场消息的上下文
    const openingMessages = [];
    if (scene) {
      openingMessages.push({
        role: 'user',
        content: `我想练习"${scene.name}"场景，请开始训练。`,
      });
    } else {
      openingMessages.push({
        role: 'user',
        content: '你好，我想开始社交训练，请引导我。',
      });
    }

    // 调用LLM获取教练开场白
    const memberLevel = req.user.memberLevel || 'free';
    const openingReply = await chat({
      memberLevel,
      systemPrompt,
      messages: openingMessages,
    });

    // 保存会话状态
    const chatMessages = [
      ...openingMessages,
      { role: 'assistant', content: openingReply },
    ];

    activeSessions.set(sessionId, {
      userId,
      coachId,
      sceneId,
      coach,
      scene,
      systemPrompt,
      chatMessages,
      startTime: Date.now(),
      memberLevel,
    });

    // 设置自动过期（30分钟无活动则清除）
    setTimeout(() => activeSessions.delete(sessionId), 30 * 60 * 1000);

    successResponse(res, {
      sessionId,
      coach: {
        id: coach.id,
        name: coach.name,
        avatar: coach.avatar,
        personality_type: coach.personality_type,
      },
      scene: scene ? { id: scene.id, name: scene.name } : null,
      openingMessage: openingReply,
    }, '训练已开始');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 发送消息（SSE流式）
 * 发送消息 → 调用LLM → 返回教练回复
 */
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const userId = req.user.id;

    if (!sessionId || !message) return errorResponse(res, 400, '缺少必要参数');

    // 获取会话
    const session = activeSessions.get(sessionId);
    if (!session) return errorResponse(res, 404, '训练会话不存在或已过期');
    if (session.userId !== userId) return errorResponse(res, 403, '无权访问此会话');

    // 追加用户消息
    session.chatMessages.push({ role: 'user', content: message });

    // 准备发送给LLM的消息（排除开场user消息中的场景描述，保留对话上下文）
    const llmMessages = session.chatMessages.map(({ role, content }) => ({ role, content }));

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 流式调用LLM
    let fullReply = '';
    try {
      fullReply = await chatStream({
        memberLevel: session.memberLevel,
        systemPrompt: session.systemPrompt,
        messages: llmMessages,
        onChunk: (chunk) => {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        },
      });
    } catch (llmErr) {
      // 流式失败时回退到非流式
      try {
        fullReply = await chat({
          memberLevel: session.memberLevel,
          systemPrompt: session.systemPrompt,
          messages: llmMessages,
        });
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: fullReply })}\n\n`);
      } catch (fallbackErr) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI服务暂时不可用，请稍后重试' })}\n\n`);
        res.end();
        return;
      }
    }

    // 追加教练回复到会话
    session.chatMessages.push({ role: 'assistant', content: fullReply });

    // 发送完成信号
    res.write(`data: ${JSON.stringify({ type: 'done', content: fullReply })}\n\n`);
    res.end();
  } catch (err) {
    // SSE已开始时无法使用errorResponse
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    } else {
      errorResponse(res, 500, err.message);
    }
  }
};

/**
 * 结束训练
 * 计算评分 → 保存训练记录 → 更新积分
 */
exports.endTraining = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) return errorResponse(res, 400, '缺少训练会话ID');

    const session = activeSessions.get(sessionId);
    if (!session) return errorResponse(res, 404, '训练会话不存在或已过期');
    if (session.userId !== userId) return errorResponse(res, 403, '无权访问此会话');

    // 计算训练时长（秒）
    const duration = Math.round((Date.now() - session.startTime) / 1000);

    // 获取场景的rounds数据用于评估
    let sceneRounds = [];
    if (session.sceneId) {
      // 先从session中获取scene对象
      if (session.scene && session.scene.rounds) {
        sceneRounds = session.scene.rounds;
      } else {
        // 尝试从数据库或预设中查找
        const dbScene = await Scene.findById(session.sceneId);
        if (dbScene && dbScene.rounds) {
          try { sceneRounds = typeof dbScene.rounds === 'string' ? JSON.parse(dbScene.rounds) : dbScene.rounds; } catch {}
        }
        if (sceneRounds.length === 0) {
          const preset = presetScenes.find(s => s.id === session.sceneId);
          if (preset) sceneRounds = preset.rounds || [];
        }
      }
    }

    // 计算评分（优先使用场景评估，回退到基础评估）
    let result;
    if (sceneRounds.length > 0) {
      result = evaluateTraining(session.chatMessages, sceneRounds);
    } else {
      result = evaluateTrainingBasic(session.chatMessages, duration);
    }

    // 生成训练评价
    const evaluation = generateEvaluation(result.scores, result.percentage, session);

    // 保存训练记录
    const recordId = await TrainingRecord.create({
      userId,
      coachId: session.coachId,
      sceneId: session.sceneId,
      chatMessages: session.chatMessages,
      scores: {
        communication: result.scores.communication,
        expression: result.scores.expression,
        empathy: result.scores.empathy,
        emotion_control: result.scores.emotion_control,
        adaptability: result.scores.adaptability,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        stars: result.stars,
      },
      evaluation,
    });

    // 更新用户积分
    const pointsEarned = result.pointsEarned;
    if (pointsEarned > 0) {
      await User.addTrainingPoints(userId, pointsEarned);
    }

    // 清除会话
    activeSessions.delete(sessionId);

    successResponse(res, {
      recordId,
      scores: {
        communication: result.scores.communication,
        expression: result.scores.expression,
        empathy: result.scores.empathy,
        emotion_control: result.scores.emotion_control,
        adaptability: result.scores.adaptability,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        stars: result.stars,
      },
      evaluation,
      pointsEarned,
      duration,
    }, '训练已结束');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 获取训练历史
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const result = await TrainingRecord.findByUser(userId, { page, pageSize });

    // 解析JSON字段
    const items = result.items.map((item) => {
      if (item.chat_messages && typeof item.chat_messages === 'string') {
        try { item.chat_messages = JSON.parse(item.chat_messages); } catch {}
      }
      if (item.scores && typeof item.scores === 'string') {
        try { item.scores = JSON.parse(item.scores); } catch {}
      }
      if (item.evaluation && typeof item.evaluation === 'string') {
        try { item.evaluation = JSON.parse(item.evaluation); } catch {}
      }
      return item;
    });

    successResponse(res, { items, total: result.total, page, pageSize }, '获取训练历史成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 获取训练详情
 */
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const record = await TrainingRecord.findById(id);
    if (!record) return errorResponse(res, 404, '训练记录不存在');
    if (record.user_id !== userId) return errorResponse(res, 403, '无权访问此记录');

    // 解析JSON字段
    if (record.chat_messages && typeof record.chat_messages === 'string') {
      try { record.chat_messages = JSON.parse(record.chat_messages); } catch {}
    }
    if (record.scores && typeof record.scores === 'string') {
      try { record.scores = JSON.parse(record.scores); } catch {}
    }
    if (record.evaluation && typeof record.evaluation === 'string') {
      try { record.evaluation = JSON.parse(record.evaluation); } catch {}
    }

    successResponse(res, record, '获取训练详情成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 场景化训练评估
 * 根据场景rounds的scoring规则和用户选项计算五维度分数
 */
function evaluateTraining(messages, sceneRounds) {
  const scores = { communication: 0, expression: 0, empathy: 0, emotion_control: 0, adaptability: 0 };

  // 筛选用户消息
  const userMessages = messages.filter(m => m.role === 'user');
  const completedRounds = Math.min(userMessages.length, sceneRounds.length);

  for (let i = 0; i < completedRounds; i++) {
    const round = sceneRounds[i];
    const userMsg = userMessages[i];
    if (!userMsg || !round.scoring) continue;

    // 根据选择的选项索引给分
    const optionIndex = userMsg.optionIndex;
    if (optionIndex !== undefined) {
      // 选项A(0)给满分，选项C(2)给70%，选项B(1)给40%
      const multiplier = optionIndex === 0 ? 1.0 : optionIndex === 2 ? 0.7 : 0.4;
      for (const [key, value] of Object.entries(round.scoring)) {
        if (scores.hasOwnProperty(key)) {
          scores[key] = (scores[key] || 0) + value * multiplier;
        }
      }
    } else {
      // 没有optionIndex时（自由对话），根据消息长度和内容给基础分
      const msgLen = (userMsg.content || '').length;
      const baseMultiplier = msgLen >= 20 ? 0.8 : msgLen >= 10 ? 0.6 : 0.4;
      for (const [key, value] of Object.entries(round.scoring)) {
        if (scores.hasOwnProperty(key)) {
          scores[key] = (scores[key] || 0) + value * baseMultiplier;
        }
      }
    }
  }

  // 四舍五入各维度分数
  for (const key of Object.keys(scores)) {
    scores[key] = Math.round(scores[key]);
  }

  // 计算总分（满分500）
  const totalPoints = Object.values(scores).reduce((a, b) => a + b, 0);
  const percentage = Math.round(totalPoints / 500 * 100);
  const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;

  // 积分奖励
  const pointsEarned = Math.max(5, Math.round(percentage / 10));

  return { scores, totalPoints, percentage, stars, pointsEarned };
}

/**
 * 基础训练评估（无场景rounds时回退）
 * 基于对话消息长度、轮次和时长计算
 */
function evaluateTrainingBasic(messages, duration) {
  const userMessages = messages.filter(m => m.role === 'user');
  const rounds = userMessages.length;

  // 基于消息长度评估表达力
  const avgLength = rounds > 0
    ? userMessages.reduce((sum, m) => sum + (m.content || '').length, 0) / rounds
    : 0;

  const communication = Math.min(100, Math.round(rounds * 12 + avgLength * 0.5));
  const expression = Math.min(100, Math.round(avgLength * 1.5 + rounds * 5));
  const empathy = Math.min(100, Math.round(rounds * 10));
  const emotion_control = Math.min(100, Math.round(duration / 60 * 8 + rounds * 5));
  const adaptability = Math.min(100, Math.round(rounds * 8 + avgLength * 0.3));

  const scores = { communication, expression, empathy, emotion_control, adaptability };
  const totalPoints = Object.values(scores).reduce((a, b) => a + b, 0);
  const percentage = Math.round(totalPoints / 500 * 100);
  const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;
  const pointsEarned = Math.max(5, Math.round(percentage / 10));

  return { scores, totalPoints, percentage, stars, pointsEarned };
}

/**
 * 生成训练评价
 */
function generateEvaluation(scores, percentage, session) {
  const coachName = session.coach?.name || '教练';

  const dimensions = [
    { key: 'communication', name: '沟通力' },
    { key: 'expression', name: '表达力' },
    { key: 'empathy', name: '共情力' },
    { key: 'emotion_control', name: '情绪控制' },
    { key: 'adaptability', name: '应变力' },
  ];

  const sorted = [...dimensions].sort((a, b) => (scores[b.key] || 0) - (scores[a.key] || 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const improvementMap = {
    empathy: '关注对方感受',
    expression: '主动表达自己',
    emotion_control: '保持冷静',
    adaptability: '灵活应对',
    communication: '清晰表达',
  };

  let summary = `整体表现${percentage >= 70 ? '不错' : percentage >= 50 ? '还行' : '有提升空间'}！`;
  summary += `你的${best.name}表现最好，继续保持。`;
  summary += `${worst.name}方面可以多加练习，下次试试更${improvementMap[worst.key] || '努力'}。`;

  return {
    summary,
    coachComment: `${coachName}认为你这次训练综合得分${percentage}%，${percentage >= 70 ? '表现很棒' : percentage >= 50 ? '继续加油' : '别灰心，多练习就会进步'}！`,
    suggestion: percentage >= 70
      ? '可以尝试更高难度的场景挑战'
      : '建议先巩固基础场景的练习',
  };
}

// 兼容旧接口
exports.chat = async (req, res) => {
  try {
    successResponse(res, null, '请使用 startTraining + sendMessage 接口');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.getRecords = exports.getHistory;
