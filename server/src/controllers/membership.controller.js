const { successResponse, errorResponse } = require('../utils/response');

exports.listPlans = async (req, res) => {
  try {
    // TODO: 实现获取会员套餐列表逻辑
    successResponse(res, [], '获取会员套餐列表成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.subscribe = async (req, res) => {
  try {
    // TODO: 实现订阅会员逻辑
    successResponse(res, null, '订阅会员成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.getStatus = async (req, res) => {
  try {
    // TODO: 实现获取会员状态逻辑
    successResponse(res, null, '获取会员状态成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};
