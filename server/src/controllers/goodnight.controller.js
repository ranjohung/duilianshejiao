const GoodnightPlan = require('../models/GoodnightPlan');
const { successResponse, errorResponse } = require('../utils/response');

// 获取晚安计划设置
exports.getPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await GoodnightPlan.findByUser(userId);
    successResponse(res, plan);
  } catch (err) {
    errorResponse(res, 500, '获取晚安计划失败');
  }
};

// 设置晚安计划（教练+时间+开关）
exports.createPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coachId, pushTime, enabled } = req.body;
    if (!coachId || !pushTime) {
      return errorResponse(res, 400, '教练和推送时间不能为空');
    }
    await GoodnightPlan.createOrUpdate({
      userId, coachId, pushTime, enabled: enabled !== undefined ? enabled : true,
    });
    const plan = await GoodnightPlan.findByUser(userId);
    successResponse(res, plan, '设置晚安计划成功');
  } catch (err) {
    errorResponse(res, 500, '设置晚安计划失败');
  }
};

// 更新晚安计划
exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coachId, pushTime, enabled } = req.body;
    await GoodnightPlan.createOrUpdate({
      userId,
      coachId: coachId || undefined,
      pushTime: pushTime || undefined,
      enabled: enabled !== undefined ? enabled : undefined,
    });
    const plan = await GoodnightPlan.findByUser(userId);
    successResponse(res, plan, '更新晚安计划成功');
  } catch (err) {
    errorResponse(res, 500, '更新晚安计划失败');
  }
};

// 执行晚安计划（定时任务触发）
exports.execute = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await GoodnightPlan.findByUser(userId);
    if (!plan || !plan.enabled) {
      return errorResponse(res, 400, '晚安计划未启用');
    }
    // TODO: 集成LLM教练生成晚安对话内容，推送消息通知
    successResponse(res, { triggered: true, coachId: plan.coach_id, pushTime: plan.push_time }, '晚安计划已触发');
  } catch (err) {
    errorResponse(res, 500, '执行晚安计划失败');
  }
};
