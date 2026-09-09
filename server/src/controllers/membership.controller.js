const { successResponse, errorResponse } = require('../utils/response');
const { findUserById } = require('../utils/sqlite');

// 价格以元展示；正式订单必须使用分并由服务端重新计算金额。
// 体验权益属于新用户引导，不作为可购买方案返回。
const MEMBERSHIP_PLANS = [
  { level: 'daily', label: '体验日卡', price: 3.9, durationDays: 1, features: { dailyTrainings: 20, voiceTraining: false, highDifficulty: false, unlimitedScenes: true } },
  { level: 'weekly', label: '周卡', price: 19.9, durationDays: 7, features: { dailyTrainings: null, voiceTraining: true, highDifficulty: true, unlimitedScenes: true } },
  { level: 'monthly', label: '月卡', price: 69, durationDays: 30, features: { dailyTrainings: null, voiceTraining: true, highDifficulty: true, unlimitedScenes: true } },
  { level: 'yearly', label: '年卡', price: 499, durationDays: 365, features: { dailyTrainings: null, voiceTraining: true, highDifficulty: true, unlimitedScenes: true } },
];

const findPlan = level => MEMBERSHIP_PLANS.find(plan => plan.level === level);

// 获取方案只用于展示，不代表已经支付或已开通。
exports.listPlans = async (req, res) => {
  successResponse(res, { currency: 'CNY', plans: MEMBERSHIP_PLANS, paymentStatus: 'not_configured' });
};

// 演示后端只读取本地用户状态，不虚构支付订单或权益记录。
exports.getStatus = async (req, res) => {
  try {
    const user = await findUserById(req.user && req.user.id);
    successResponse(res, {
      level: user?.member_level || 'free',
      membership: null,
      plans: MEMBERSHIP_PLANS,
      paymentStatus: 'not_configured',
    });
  } catch (err) {
    errorResponse(res, 500, '获取会员状态失败');
  }
};

// 支付网关、回调验签和权益账本尚未配置。在此之前拒绝创建并开通会员，
// 避免出现“未支付即开通”的收入与合规风险。
exports.subscribe = async (req, res) => {
  const { level, paymentMethod, payment_method: paymentMethodAlias } = req.body || {};
  const plan = findPlan(level);
  if (!plan) return errorResponse(res, 400, '无效的会员方案');
  if (!(paymentMethod || paymentMethodAlias)) return errorResponse(res, 400, '请选择支付方式');
  return errorResponse(res, 503, '支付服务尚未配置，本次未创建订单、未扣款、未开通会员');
};

exports.getComparison = async (req, res) => {
  successResponse(res, {
    headers: ['权益', '免费版', '体验日卡', '周卡', '月卡', '年卡'],
    rows: [
      { feature: 'AI对话引擎', values: ['基础额度', 'DeepSeek', 'DeepSeek', 'DeepSeek高优', 'DeepSeek高优'] },
      { feature: '每日训练次数', values: ['5次', '20次', '不限日常次数*', '不限日常次数*', '不限日常次数*'] },
      { feature: '语音训练', values: ['❌', '❌', '✅', '✅', '✅'] },
      { feature: '高难度关卡', values: ['按等级/积分/券', '直接访问', '直接访问', '直接访问', '直接访问'] },
      { feature: '全部场景访问', values: ['逐项解锁', '会员期内访问', '会员期内访问', '会员期内访问', '会员期内访问'] },
      { feature: '价格', values: ['免费', '¥3.9/日', '¥19.9/周', '¥69/月', '¥499/年'] },
    ],
    note: '* 会员不限免费用户的每日次数，但仍受服务端安全限频和异常检测约束。',
  });
};

module.exports.MEMBERSHIP_PLANS = MEMBERSHIP_PLANS;
