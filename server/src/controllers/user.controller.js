const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    // 脱敏处理
    const profile = {
      id: user.id,
      phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      age: user.age,
      memberLevel: user.member_level,
      isRealNameVerified: !!user.is_real_name_verified,
      studentLevel: user.student_level,
      trainingPoints: user.training_points,
      totalPoints: user.total_points,
      weeklyTrainingsUsed: user.weekly_trainings_used,
      createdAt: user.created_at,
    };

    successResponse(res, profile, '获取用户资料成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, gender, age } = req.body;

    await User.updateProfile(req.user.id, { nickname, avatar, gender, age });

    successResponse(res, null, '更新用户资料成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.getGrowthStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    const stats = {
      trainingPoints: user.training_points || 0,
      totalPoints: user.total_points || 0,
      studentLevel: user.student_level || 'bronze',
      weeklyTrainingsUsed: user.weekly_trainings_used || 0,
      memberLevel: user.member_level || 'free',
      // TODO: 五维度分数需要从训练记录表中聚合
      dimensions: {
        expression: 0,
        listening: 0,
        empathy: 0,
        logic: 0,
        confidence: 0,
      },
    };

    successResponse(res, stats, '获取成长数据成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};
