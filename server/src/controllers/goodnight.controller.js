const { successResponse, errorResponse } = require('../utils/response');

async function getPlan(req, res) {
  try {
    successResponse(res, {}, '获取晚安计划成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function trigger(req, res) {
  try {
    successResponse(res, {}, '触发晚安计划成功');
  } catch (error) {
    errorResponse(res, 500, '触发失败', error.message);
  }
}

module.exports = { getPlan, trigger };
