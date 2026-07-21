const { successResponse, errorResponse } = require('../utils/response');

async function createPlan(req, res) {
  try {
    successResponse(res, {}, '创建晚安计划成功');
  } catch (error) {
    errorResponse(res, 500, '创建失败', error.message);
  }
}

async function getPlan(req, res) {
  try {
    successResponse(res, {}, '获取晚安计划成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function updatePlan(req, res) {
  try {
    successResponse(res, {}, '更新晚安计划成功');
  } catch (error) {
    errorResponse(res, 500, '更新失败', error.message);
  }
}

async function execute(req, res) {
  try {
    successResponse(res, {}, '执行晚安计划成功');
  } catch (error) {
    errorResponse(res, 500, '执行失败', error.message);
  }
}

module.exports = { createPlan, getPlan, updatePlan, execute };