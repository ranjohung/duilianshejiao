const { successResponse, errorResponse } = require('../utils/response');

async function getProfile(req, res) {
  try {
    successResponse(res, {
      userId: req.user.id,
      totalPoints: 100,
      level: 'bronze',
      dimensions: {
        communication: 60,
        expression: 55,
        empathy: 65,
        emotionControl: 50,
        adaptability: 55,
      },
    }, '获取成长档案成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function getMilestones(req, res) {
  try {
    successResponse(res, [], '获取里程碑成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function updateDimensions(req, res) {
  try {
    successResponse(res, req.body, '更新维度成功');
  } catch (error) {
    errorResponse(res, 500, '更新失败', error.message);
  }
}

async function getDiary(req, res) {
  try {
    successResponse(res, [], '获取日记成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function createDiary(req, res) {
  try {
    successResponse(res, {}, '创建日记成功');
  } catch (error) {
    errorResponse(res, 500, '创建失败', error.message);
  }
}

async function getLearningCards(req, res) {
  try {
    successResponse(res, [], '获取学习卡片成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function getWeeklyProgress(req, res) {
  try {
    successResponse(res, {
      weekStart: new Date().toISOString(),
      weekEnd: new Date().toISOString(),
      data: [],
    }, '获取周进度成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function getProgressCurve(req, res) {
  try {
    successResponse(res, [], '获取进度曲线成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

module.exports = {
  getProfile,
  getMilestones,
  updateDimensions,
  getDiary,
  createDiary,
  getLearningCards,
  getWeeklyProgress,
  getProgressCurve,
};
