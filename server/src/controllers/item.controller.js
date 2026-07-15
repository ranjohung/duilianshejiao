const { successResponse, errorResponse } = require('../utils/response');

exports.listItems = async (req, res) => {
  try {
    // TODO: 实现获取道具列表逻辑
    successResponse(res, [], '获取道具列表成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.purchase = async (req, res) => {
  try {
    // TODO: 实现购买道具逻辑
    successResponse(res, null, '购买道具成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.getBag = async (req, res) => {
  try {
    // TODO: 实现获取背包逻辑
    successResponse(res, [], '获取背包成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};
