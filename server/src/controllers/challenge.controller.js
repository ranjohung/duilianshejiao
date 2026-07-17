const { successResponse, errorResponse } = require('../utils/response');
const RealChallenge = require('../models/RealChallenge');
const User = require('../models/User');

async function listChallenges(req, res) {
  try {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20, category } = req.query;

    const challenges = await RealChallenge.findAll({ 
      page: parseInt(page), 
      pageSize: parseInt(pageSize),
      category,
    });

    const itemsWithStatus = await Promise.all(challenges.items.map(async (challenge) => {
      const status = userId ? await RealChallenge.getUserChallengeStatus(userId, challenge.id) : null;
      return {
        ...challenge,
        userStatus: status,
      };
    }));

    successResponse(res, { challenges: itemsWithStatus, total: challenges.total }, '获取挑战列表成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function getChallengeDetail(req, res) {
  try {
    const userId = req.user?.id;
    const { challengeId } = req.params;

    const challenge = await RealChallenge.findById(challengeId);
    if (!challenge) {
      return errorResponse(res, 404, '挑战不存在');
    }

    const status = userId ? await RealChallenge.getUserChallengeStatus(userId, challengeId) : null;

    successResponse(res, {
      ...challenge,
      userStatus: status,
    }, '获取挑战详情成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function startChallenge(req, res) {
  try {
    const userId = req.user?.id;
    const { challengeId } = req.params;

    const challenge = await RealChallenge.findById(challengeId);
    if (!challenge) {
      return errorResponse(res, 404, '挑战不存在');
    }

    const existingStatus = await RealChallenge.getUserChallengeStatus(userId, challengeId);
    if (existingStatus && existingStatus.status === 'in_progress') {
      return errorResponse(res, 400, '该挑战正在进行中');
    }

    const userChallengeId = await RealChallenge.startChallenge(userId, challengeId);

    successResponse(res, {
      challengeId,
      userChallengeId,
      status: 'in_progress',
      progress: 0,
    }, '开始挑战成功');
  } catch (error) {
    errorResponse(res, 500, '开始失败', error.message);
  }
}

async function updateChallengeProgress(req, res) {
  try {
    const userId = req.user?.id;
    const { challengeId } = req.params;
    const { increment = 1 } = req.body;

    const challenge = await RealChallenge.findById(challengeId);
    if (!challenge) {
      return errorResponse(res, 404, '挑战不存在');
    }

    const success = await RealChallenge.updateProgress(userId, challengeId, increment);
    if (!success) {
      return errorResponse(res, 400, '更新进度失败，请先开始挑战');
    }

    const status = await RealChallenge.getUserChallengeStatus(userId, challengeId);
    const isCompleted = status && status.progress >= challenge.target_count;

    if (isCompleted) {
      const result = await RealChallenge.completeChallenge(userId, challengeId);
      if (result) {
        await User.updatePoints(userId, result.reward_points);
      }

      successResponse(res, {
        challengeId,
        progress: challenge.target_count,
        completed: true,
        reward_points: result?.reward_points || 0,
      }, '挑战完成！获得奖励');
    } else {
      successResponse(res, {
        challengeId,
        progress: status?.progress || 0,
        completed: false,
      }, '进度更新成功');
    }
  } catch (error) {
    errorResponse(res, 500, '更新失败', error.message);
  }
}

async function completeChallenge(req, res) {
  try {
    const userId = req.user?.id;
    const { challengeId } = req.params;

    const challenge = await RealChallenge.findById(challengeId);
    if (!challenge) {
      return errorResponse(res, 404, '挑战不存在');
    }

    const status = await RealChallenge.getUserChallengeStatus(userId, challengeId);
    if (!status || status.status !== 'in_progress') {
      return errorResponse(res, 400, '请先开始挑战');
    }

    if (status.progress < challenge.target_count) {
      return errorResponse(res, 400, `进度不足，当前完成${status.progress}/${challenge.target_count}`);
    }

    const result = await RealChallenge.completeChallenge(userId, challengeId);
    if (!result) {
      return errorResponse(res, 500, '完成挑战失败');
    }

    await User.updatePoints(userId, result.reward_points);

    successResponse(res, {
      challengeId,
      completed: true,
      reward_points: result.reward_points,
    }, '挑战完成！获得奖励');
  } catch (error) {
    errorResponse(res, 500, '完成失败', error.message);
  }
}

async function getUserCompletedChallenges(req, res) {
  try {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20 } = req.query;

    const result = await RealChallenge.getUserCompletedChallenges(userId, { page: parseInt(page), pageSize: parseInt(pageSize) });

    successResponse(res, { challenges: result.items, total: result.total }, '获取已完成挑战成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function getChallengeCategories(req, res) {
  try {
    const categories = [
      { id: 'social', name: '社交', icon: '🤝' },
      { id: 'expression', name: '表达', icon: '🎤' },
      { id: 'empathy', name: '共情', icon: '❤️' },
      { id: 'confidence', name: '自信', icon: '💪' },
    ];

    successResponse(res, categories, '获取挑战分类成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

module.exports = {
  listChallenges,
  getChallengeDetail,
  startChallenge,
  updateChallengeProgress,
  completeChallenge,
  getUserCompletedChallenges,
  getChallengeCategories,
};