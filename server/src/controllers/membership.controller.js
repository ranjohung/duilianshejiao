const Membership = require('../models/Membership');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// 会员方案定义
const MEMBERSHIP_PLANS = [
  { level: 'experience', label: '体验版', price: 0, duration: 0, features: { llmEngine: 'deepseek', weeklyTrainings: 1, renderType: '2d', voiceTraining: false, highDifficulty: false, weeklyShuttles: 0, weeklyDoublePoints: 0 } },
  { level: 'free', label: '免费版', price: 0, duration: 0, features: { llmEngine: 'ollama', weeklyTrainings: 15, renderType: '2d', voiceTraining: false, highDifficulty: false, weeklyShuttles: 0, weeklyDoublePoints: 0 } },
  { level: 'daily', label: '日卡', price: 3.9, duration: 1, features: { llmEngine: 'deepseek', weeklyTrainings: 20, renderType: '2d', voiceTraining: false, highDifficulty: false, weeklyShuttles: 0, weeklyDoublePoints: 0 } },
  { level: 'weekly', label: '周卡', price: 18, duration: 7, features: { llmEngine: 'deepseek', weeklyTrainings: Infinity, renderType: '2.5d', voiceTraining: true, highDifficulty: true, weeklyShuttles: 3, weeklyDoublePoints: 1 } },
  { level: 'monthly', label: '月卡', price: 58, duration: 30, features: { llmEngine: 'deepseek', weeklyTrainings: Infinity, renderType: '3d', voiceTraining: true, highDifficulty: true, weeklyShuttles: 10, weeklyDoublePoints: 3 } },
  { level: 'yearly', label: '年卡', price: 398, duration: 365, features: { llmEngine: 'deepseek_high', weeklyTrainings: Infinity, renderType: '3d_plus', voiceTraining: true, highDifficulty: true, weeklyShuttles: 15, weeklyDoublePoints: 3 } },
];

// 获取会员方案列表
exports.listPlans = async (req, res) => {
  successResponse(res, MEMBERSHIP_PLANS);
};

// 获取当前会员状态
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const membership = await Membership.findActiveByUser(userId);
    successResponse(res, {
      level: user.member_level,
      membership,
      plans: MEMBERSHIP_PLANS,
    });
  } catch (err) { errorResponse(res, 500, '获取会员状态失败'); }
};

// 购买会员
exports.subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { level, paymentMethod } = req.body;
    const plan = MEMBERSHIP_PLANS.find(p => p.level === level);
    if (!plan) return errorResponse(res, 400, '无效的会员方案');

    // 创建会员记录
    const expiresAt = plan.duration > 0
      ? new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000)
      : null;

    const membershipId = await Membership.create({
      userId, level: plan.level, price: plan.price,
      startDate: new Date(), expiresAt, paymentMethod,
    });

    // 更新用户会员等级
    await User.updateMemberLevel(userId, plan.level);

    // 发放会员道具（穿梭券+双倍积分卡）
    const Item = require('../models/Item');
    if (plan.features.weeklyShuttles > 0) await Item.grantItem(userId, 'time_shuttle', plan.features.weeklyShuttles);
    if (plan.features.weeklyDoublePoints > 0) await Item.grantItem(userId, 'double_points', plan.features.weeklyDoublePoints);

    successResponse(res, { membershipId, plan, expiresAt }, '购买成功');
  } catch (err) { errorResponse(res, 500, '购买失败'); }
};

// 会员权益对比表
exports.getComparison = async (req, res) => {
  successResponse(res, {
    headers: ['权益', '体验', '免费', '日卡', '周卡', '月卡', '年卡'],
    rows: [
      { feature: 'LLM引擎', values: ['DeepSeek(1次)', 'Ollama+10%偶遇', 'DeepSeek', 'DeepSeek', 'DeepSeek', 'DeepSeek高优'] },
      { feature: '每周训练', values: ['1次', '15次', '20次', '无限', '无限', '无限'] },
      { feature: '教练渲染', values: ['2D', '2D', '2D', '2.5D', '3D', '3D+真人'] },
      { feature: '语音训练', values: ['❌', '❌', '❌', '✅', '✅', '✅'] },
      { feature: '高难度关卡', values: ['❌', '❌', '❌', '✅', '✅', '✅'] },
      { feature: '穿梭券', values: ['0', '签到获取', '签到获取', '3张/周', '10张/月', '15张/月'] },
      { feature: '双倍积分卡', values: ['0', '签到获取', '签到获取', '1张/周', '3张/月', '3张/月'] },
      { feature: '价格', values: ['免费', '免费', '¥3.9/日', '¥18/周', '¥58/月', '¥398/年'] },
    ]
  });
};
