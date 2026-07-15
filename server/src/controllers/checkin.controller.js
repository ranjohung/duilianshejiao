const { successResponse, errorResponse } = require('../utils/response');

exports.checkIn = async (req, res) => {
  try {
    // TODO: 实现签到逻辑
    successResponse(res, null, '签到成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.getToday = async (req, res) => {
  try {
    // TODO: 实现获取今日签到逻辑
    successResponse(res, null, '获取今日签到成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.getCalendar = async (req, res) => {
  try {
    // TODO: 实现获取签到日历逻辑
    successResponse(res, [], '获取签到日历成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};
