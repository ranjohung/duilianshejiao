const { successResponse, errorResponse } = require('../utils/response');
const presetScenes = require('../data/presetScenes');
const TrainingRecord = require('../models/TrainingRecord');
const User = require('../models/User');
const Item = require('../models/Item');

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

    const scene = presetScenes.find(s => s.id === sceneId);
    if (!scene) {
      return errorResponse(res, 404, '场景不存在');
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
      history: [],
    });

    const npcMessage = {
      role: 'assistant',
      content: firstRound.situation,
      options: firstRound.options,
    };

    activeTrainings.get(sessionId).messages.push(npcMessage);

    successResponse(res, {
      sessionId,
      currentRound: 1,
      totalRounds: scene.rounds.length,
      currentScore: 0,
      message: firstRound.situation,
      options: firstRound.options,
      remainingTimeTravel,
      canUseHint,
    });
  } catch (error) {
    errorResponse(res, 500, '启动训练失败', error.message);
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

    if (useTimeTravel && training.history.length > 0) {
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

    const duration = Math.floor((Date.now() - training.startTime) / 1000);
    const finalScore = training.currentScore;

    const result = {
      sessionId,
      sceneId: training.sceneId,
      coachId: training.coachId,
      score: finalScore,
      duration,
      totalRounds: training.totalRounds,
      completedRounds: training.currentRoundIndex + 1,
      messages: training.messages,
    };

    try {
      await TrainingRecord.create({
        userId: training.userId || 'test_user',
        sceneId: training.sceneId,
        coachId: training.coachId,
        score: finalScore,
        duration,
        mode: 'text',
        startedAt: new Date(training.startTime),
        endedAt: new Date(),
      });

      if (training.userId) {
        const pointsToAdd = Math.floor(finalScore / 10);
        await User.updatePoints(training.userId, pointsToAdd);
        await User.incrementTotalTrainings(training.userId);

        const userStats = await User.getUserStats(training.userId);
        result.userPoints = userStats.points;
        result.userLevel = userStats.level;
        result.pointsEarned = pointsToAdd;
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

    const useResult = await Item.useItem(training.userId, itemId);
    if (!useResult.success) {
      return errorResponse(res, 400, useResult.message);
    }

    let responseData = { itemId, success: true, remaining: useResult.remaining };

    if (itemId === 'double_points') {
      training.useDoublePoints = true;
      responseData = { ...responseData, effect: '双倍积分卡已激活，下一轮获得双倍积分' };
    } else if (itemId === 'time_shuttle') {
      responseData = { ...responseData, effect: '时空穿梭券已激活，可回到上一轮' };
    } else if (itemId === 'hint_card') {
      const currentRound = training.scene.rounds[training.currentRoundIndex];
      responseData = { ...responseData, effect: '提示已获取', hint: currentRound.coach_hint };
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

    const records = await TrainingRecord.find({ userId })
      .sort({ startedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await TrainingRecord.countDocuments({ userId });

    successResponse(res, {
      items: records.map(r => ({
        id: r._id,
        sceneId: r.sceneId,
        coachId: r.coachId,
        score: r.score,
        duration: r.duration,
        mode: r.mode,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
      })),
      total,
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

    const record = await TrainingRecord.findOne({ _id: id, userId });
    if (!record) {
      return errorResponse(res, 404, '训练记录不存在');
    }

    successResponse(res, {
      id: record._id,
      sceneId: record.sceneId,
      coachId: record.coachId,
      score: record.score,
      duration: record.duration,
      mode: record.mode,
      startedAt: record.startedAt,
      endedAt: record.endedAt,
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