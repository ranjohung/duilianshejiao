const { successResponse, errorResponse } = require('../utils/response');
const presetScenes = require('../data/presetScenes');
const TrainingRecord = require('../models/TrainingRecord');
const User = require('../models/User');
const Item = require('../models/Item');
const Scene = require('../models/Scene');

const activeTrainings = new Map();

function generateSessionId() {
  return 'tr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function calculateScore(round, choiceIndex) {
  const optionCount = round.options.length;
  const idealIndex = 0;

  if (choiceIndex === idealIndex) {
    const maxScore = Object.values(round.scoring).reduce((a, b) => a + b, 0);
    return Math.floor(maxScore * 0.85);
  } else if (choiceIndex === optionCount - 1) {
    const maxScore = Object.values(round.scoring).reduce((a, b) => a + b, 0);
    return Math.floor(maxScore * 0.6);
  }
  return Math.floor(Object.values(round.scoring).reduce((a, b) => a + b, 0) * 0.3);
}

function getFeedback(round, choiceIndex) {
  const optionCount = round.options.length;
  const idealIndex = 0;

  if (choiceIndex === idealIndex) {
    return {
      content: '你的回应展现了共情力！',
      score_delta: calculateScore(round, choiceIndex),
      tip: round.coach_hint,
    };
  } else if (choiceIndex === optionCount - 1) {
    return {
      content: '你的回应还不错，有提升空间。',
      score_delta: calculateScore(round, choiceIndex),
      tip: round.coach_hint,
    };
  }
  return {
    content: '这个回应可能不太合适，再想想看。',
    score_delta: calculateScore(round, choiceIndex),
    tip: round.coach_hint,
  };
}

async function startTraining(req, res) {
  try {
    const { coachId, sceneId, mode = 'text' } = req.body;
    const userId = req.user?.id;

    // Web/Flutter 可能分别传字符串或数字 ID，统一按字符串比较，避免同一场景被误报不存在。
    const scene = presetScenes.find(s => String(s.id) === String(sceneId));
    if (!scene) {
      return errorResponse(res, 404, '场景不存在');
    }

    // 训练路由也必须执行场景解锁校验，不能只依赖场景页的前端按钮。
    // 永久解锁记录和每日额度账本仍需生产表结构接入；当前至少阻断等级/积分门槛绕过。
    if (userId) {
      const unlockResult = await Scene.checkUnlock(sceneId, userId);
      if (!unlockResult.unlocked) {
        return errorResponse(res, 403, unlockResult.reason || '场景尚未解锁');
      }
    }

    const sessionId = generateSessionId();
    const firstRound = scene.rounds[0];

    let remainingTimeTravel = 0;
    let canUseHint = true;

    if (userId) {
      remainingTimeTravel = await Item.getUserItemCount(userId, 'time_shuttle');
      const hintCount = await Item.getUserItemCount(userId, 'hint_card');
      canUseHint = hintCount > 0;
    }

    activeTrainings.set(sessionId, {
      sessionId,
      coachId,
      sceneId,
      scene,
      currentRoundIndex: 0,
      totalRounds: scene.rounds.length,
      currentScore: 0,
      messages: [],
      startTime: Date.now(),
      userId,
      useDoublePoints: false,
      itemsUsed: { time_shuttle: 0, hint_card: 0, emotion_shield: 0, double_points: 0 },
      itemRounds: { time_shuttle: new Set(), hint_card: new Set() },
      history: [],
    });

    const npcMessage = {
      role: 'assistant',
      content: firstRound.situation,
      options: firstRound.options,
    };

    activeTrainings.get(sessionId).messages.push(npcMessage);

    const responseData = {
      sessionId,
      currentRound: 1,
      totalRounds: scene.rounds.length,
      currentScore: 0,
      message: firstRound.situation,
      options: firstRound.options,
      remainingTimeTravel,
      canUseHint,
    };
    // 场景控制器会复用此方法；没有 Express response 时返回统一结果，避免重复发送/undefined。
    if (res && typeof res.json === 'function') {
      return successResponse(res, responseData, '训练启动成功');
    }
    return { success: true, data: responseData, message: '训练启动成功' };
  } catch (error) {
    if (res && typeof res.json === 'function') {
      return errorResponse(res, 500, '启动训练失败', error.message);
    }
    return { success: false, code: 500, message: '启动训练失败' };
  }
}

async function sendMessage(req, res) {
  try {
    const { sessionId, message, choiceIndex, useHint = false, useTimeTravel = false } = req.body;

    const training = activeTrainings.get(sessionId);
    if (!training) {
      return errorResponse(res, 404, '训练会话不存在');
    }

    const { scene, currentRoundIndex, totalRounds, currentScore, userId, useDoublePoints } = training;
    const currentRound = scene.rounds[currentRoundIndex];

    if (useTimeTravel) {
      if (!userId) return errorResponse(res, 401, '请先登录');
      if (!training.itemsUsed) training.itemsUsed = { time_shuttle: 0, hint_card: 0, emotion_shield: 0, double_points: 0 };
      if (!training.itemRounds) training.itemRounds = { time_shuttle: new Set(), hint_card: new Set() };
      if (training.history.length === 0) return errorResponse(res, 400, '完成至少一轮后才能使用时空穿梭券');
      if (training.itemsUsed.time_shuttle >= 2) return errorResponse(res, 400, '本次训练最多使用2张时空穿梭券');
      if (training.itemRounds.time_shuttle.has(currentRoundIndex)) return errorResponse(res, 400, '同一轮只能使用1张时空穿梭券');
      const itemResult = await Item.useItem(userId, 'time_shuttle');
      if (!itemResult.success) return errorResponse(res, 400, itemResult.message);
      training.itemsUsed.time_shuttle += 1;
      training.itemRounds.time_shuttle.add(currentRoundIndex);
      const lastState = training.history[training.history.length - 1];
      training.currentRoundIndex = lastState.currentRoundIndex;
      training.currentScore = lastState.currentScore;
      training.messages = lastState.messages.slice(0, -1);
      training.history.pop();

      const round = scene.rounds[training.currentRoundIndex];
      return successResponse(res, {
        sessionId,
        currentRound: training.currentRoundIndex + 1,
        totalRounds,
        currentScore: training.currentScore,
        message: round.situation,
        options: round.options,
        timeTravelSuccess: true,
      });
    }

    if (useHint) {
      if (!userId) return errorResponse(res, 401, '请先登录');
      if (!training.itemsUsed) training.itemsUsed = { time_shuttle: 0, hint_card: 0, emotion_shield: 0, double_points: 0 };
      if (!training.itemRounds) training.itemRounds = { time_shuttle: new Set(), hint_card: new Set() };
      if (training.itemRounds.hint_card.has(currentRoundIndex)) return errorResponse(res, 400, '同一轮只能使用1张提示卡');
      const itemResult = await Item.useItem(userId, 'hint_card');
      if (!itemResult.success) return errorResponse(res, 400, itemResult.message);
      training.itemsUsed.hint_card += 1;
      training.itemRounds.hint_card.add(currentRoundIndex);
      return successResponse(res, {
        sessionId,
        hint: currentRound.coach_hint,
        hintUsed: true,
      });
    }

    training.history.push({
      currentRoundIndex,
      currentScore,
      messages: [...training.messages],
    });

    const finalChoiceIndex = choiceIndex ?? currentRound.options.indexOf(message);
    const feedback = getFeedback(currentRound, finalChoiceIndex !== -1 ? finalChoiceIndex : -1);
    
    let finalScoreDelta = feedback.score_delta;
    // 情绪护盾只抵消本轮负面评分的一半，且用过一次后立即失效。
    if (training.useShield && finalScoreDelta < 0) {
      finalScoreDelta = Math.ceil(finalScoreDelta / 2);
      training.useShield = false;
    }
    if (useDoublePoints) {
      finalScoreDelta = feedback.score_delta * 2;
      training.useDoublePoints = false;
    }
    
    const newScore = currentScore + finalScoreDelta;

    training.currentScore = newScore;
    training.messages.push({
      role: 'user',
      content: message,
      choice_index: choiceIndex !== -1 ? choiceIndex : -1,
    });

    let nextMessage = null;
    let nextOptions = null;
    let isFinished = false;

    const nextRoundIndex = currentRoundIndex + 1;

    if (nextRoundIndex < totalRounds) {
      const nextRound = scene.rounds[nextRoundIndex];
      nextMessage = nextRound.situation;
      nextOptions = nextRound.options;
      training.currentRoundIndex = nextRoundIndex;

      training.messages.push({
        role: 'assistant',
        content: nextMessage,
        options: nextOptions,
      });
    } else {
      isFinished = true;
    }

    successResponse(res, {
      sessionId,
      currentRound: nextRoundIndex + 1,
      totalRounds,
      currentScore: newScore,
      feedback: {
        ...feedback,
        score_delta: finalScoreDelta,
      },
      message: nextMessage,
      options: nextOptions,
      isFinished,
    });
  } catch (error) {
    errorResponse(res, 500, '发送消息失败', error.message);
  }
}

async function endTraining(req, res) {
  try {
    const { sessionId } = req.body;

    const training = activeTrainings.get(sessionId);
    if (!training) {
      return errorResponse(res, 404, '训练会话不存在');
    }

    if (training.settlementApplied) {
      return errorResponse(res, 409, '该训练已结算，不能重复领取奖励');
    }
    training.settlementApplied = true;

    const duration = Math.floor((Date.now() - training.startTime) / 1000);
    const finalScore = training.currentScore;
    const completedRounds = Math.min(training.totalRounds, training.currentRoundIndex + 1);
    const completionRate = training.totalRounds > 0 ? completedRounds / training.totalRounds : 0;
    const eligible = completionRate >= 0.7 && finalScore >= 30;
    const requestedPoints = eligible
      ? Math.round(Math.max(20, Math.min(50, finalScore / 10)))
      : 0;

    const result = {
      sessionId,
      sceneId: training.sceneId,
      coachId: training.coachId,
      score: finalScore,
      duration,
      totalRounds: training.totalRounds,
      completedRounds,
      completionRate,
      eligible,
      pointsReason: eligible ? null : (completionRate < 0.7 ? '训练完成度不足70%' : '训练评分低于30分'),
      messages: training.messages,
    };

    try {
      await TrainingRecord.create({
        userId: training.userId || 'test_user',
        sceneId: training.sceneId,
        coachId: training.coachId,
        score: finalScore,
        duration,
        messages: training.messages,
      });

      if (training.userId) {
        const beforeStats = requestedPoints > 0 ? await User.getUserStats(training.userId) : null;
        const pointResult = requestedPoints > 0
          ? await User.updatePoints(training.userId, requestedPoints)
          : null;
        await User.incrementTotalTrainings(training.userId);

        const userStats = await User.getUserStats(training.userId);
        result.userPoints = userStats.points;
        result.totalPoints = userStats.totalPoints;
        result.userLevel = userStats.level;
        // 返回实际入账差额，避免积分上限/账本策略截断时前端显示虚高奖励。
        result.pointsEarned = pointResult?.newPoints !== undefined
          ? Math.max(0, Number(pointResult.newPoints) - Number(beforeStats?.points || 0))
          : 0;
      }
    } catch (dbError) {
      console.warn('保存训练记录失败:', dbError.message);
    }

    activeTrainings.delete(sessionId);

    successResponse(res, result);
  } catch (error) {
    errorResponse(res, 500, '结束训练失败', error.message);
  }
}

async function useItem(req, res) {
  try {
    const { sessionId, itemId } = req.body;

    const training = activeTrainings.get(sessionId);
    if (!training) {
      return errorResponse(res, 404, '训练会话不存在');
    }

    if (!training.userId) {
      return errorResponse(res, 401, '请先登录');
    }

    const normalizedItemId = itemId === 'shield' ? 'emotion_shield' : itemId;
    const allowedItems = ['time_shuttle', 'hint_card', 'emotion_shield', 'double_points'];
    if (!allowedItems.includes(normalizedItemId)) {
      return errorResponse(res, 400, '该道具不能在训练中使用');
    }
    if (!training.itemsUsed) training.itemsUsed = { time_shuttle: 0, hint_card: 0, emotion_shield: 0, double_points: 0 };
    if (!training.itemRounds) training.itemRounds = { time_shuttle: new Set(), hint_card: new Set() };
    const roundKey = training.currentRoundIndex;
    if (normalizedItemId === 'time_shuttle') {
      if (training.history.length === 0) return errorResponse(res, 400, '完成至少一轮后才能使用时空穿梭券');
      if (training.itemsUsed.time_shuttle >= 2) return errorResponse(res, 400, '本次训练最多使用2张时空穿梭券');
      if (training.itemRounds.time_shuttle.has(roundKey)) return errorResponse(res, 400, '同一轮只能使用1张时空穿梭券');
    }
    if (normalizedItemId === 'hint_card' && training.itemRounds.hint_card.has(roundKey)) {
      return errorResponse(res, 400, '同一轮只能使用1张提示卡');
    }
    if (normalizedItemId === 'emotion_shield' && training.itemsUsed.emotion_shield >= 1) {
      return errorResponse(res, 400, '本次训练最多使用1张情绪护盾');
    }
    if (normalizedItemId === 'double_points' && training.itemsUsed.double_points >= 1) {
      return errorResponse(res, 400, '本次训练最多使用1张双倍积分卡');
    }

    const useResult = await Item.useItem(training.userId, normalizedItemId);
    if (!useResult.success) {
      return errorResponse(res, 400, useResult.message);
    }

    training.itemsUsed[normalizedItemId] += 1;
    if (normalizedItemId === 'time_shuttle') training.itemRounds.time_shuttle.add(roundKey);
    if (normalizedItemId === 'hint_card') training.itemRounds.hint_card.add(roundKey);
    let responseData = { itemId: normalizedItemId, success: true, remaining: useResult.remaining };

    if (normalizedItemId === 'double_points') {
      training.useDoublePoints = true;
      responseData = { ...responseData, effect: '双倍积分卡已激活，下一轮获得双倍积分' };
    } else if (normalizedItemId === 'time_shuttle') {
      const lastState = training.history[training.history.length - 1];
      training.currentRoundIndex = lastState.currentRoundIndex;
      training.currentScore = lastState.currentScore;
      training.messages = lastState.messages.slice(0, -1);
      training.history.pop();
      const rewindRound = training.scene.rounds[training.currentRoundIndex];
      responseData = {
        ...responseData,
        effect: '时空穿梭券已使用，已回到上一轮',
        timeTravelSuccess: true,
        currentRound: training.currentRoundIndex + 1,
        totalRounds: training.totalRounds,
        currentScore: training.currentScore,
        message: rewindRound.situation,
        options: rewindRound.options,
      };
    } else if (normalizedItemId === 'hint_card') {
      const currentRound = training.scene.rounds[training.currentRoundIndex];
      responseData = { ...responseData, effect: '提示已获取', hint: currentRound.coach_hint };
    } else if (normalizedItemId === 'emotion_shield') {
      training.useShield = true;
      responseData = { ...responseData, effect: '情绪护盾已激活，本次训练最多抵消一轮负面影响' };
    }

    successResponse(res, responseData, '道具使用成功');
  } catch (error) {
    errorResponse(res, 500, '使用道具失败', error.message);
  }
}

async function getHistory(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const userId = req.user?.id || 'test_user';

    const result = await TrainingRecord.findByUser(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });

    successResponse(res, {
      items: result.items.map(r => ({
        id: r.id,
        sceneId: r.scene_id,
        coachId: r.coach_id,
        score: r.score,
        duration: r.duration,
        mode: 'text',
        startedAt: r.created_at,
        endedAt: r.created_at,
      })),
      total: result.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    errorResponse(res, 500, '获取训练历史失败', error.message);
  }
}

async function getDetail(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'test_user';

    const record = await TrainingRecord.findByIdForUser(id, userId);
    if (!record) {
      return errorResponse(res, 404, '训练记录不存在');
    }

    successResponse(res, {
      id: record.id,
      sceneId: record.scene_id,
      coachId: record.coach_id,
      score: record.score,
      duration: record.duration,
      mode: 'text',
      startedAt: record.created_at,
      endedAt: record.created_at,
    });
  } catch (error) {
    errorResponse(res, 500, '获取训练详情失败', error.message);
  }
}

module.exports = {
  startTraining,
  sendMessage,
  endTraining,
  useItem,
  getHistory,
  getDetail,
};
