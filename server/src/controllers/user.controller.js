const { successResponse, errorResponse } = require('../utils/response');

async function getProfile(req, res) {
  try {
    const user = req.user || { id: 'test_user', phone: '13800138000', nickname: '测试用户' };
    successResponse(res, {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: '',
      gender: 'other',
      age: 25,
    }, '获取用户信息成功');
  } catch (error) {
    errorResponse(res, 500, '获取用户信息失败', error.message);
  }
}

async function updateProfile(req, res) {
  try {
    const { nickname, avatar, gender, age } = req.body;
    successResponse(res, {
      nickname: nickname || '测试用户',
      avatar: avatar || '',
      gender: gender || 'other',
      age: age || 25,
    }, '更新成功');
  } catch (error) {
    errorResponse(res, 500, '更新失败', error.message);
  }
}

async function getGrowthStats(req, res) {
  try {
    successResponse(res, {
      totalPoints: 100,
      level: 'bronze',
      currentExp: 50,
      nextLevelExp: 100,
    }, '获取成长数据成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getGrowthStats,
};
