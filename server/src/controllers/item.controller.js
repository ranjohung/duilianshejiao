const { successResponse, errorResponse } = require('../utils/response');

const ITEMS = [
  { id: 'time_shuttle', name: '时空穿梭券', description: '可以回到上一轮重新选择', icon: '⏳', price: 0 },
  { id: 'hint_card', name: '提示卡', description: '获取教练的提示', icon: '💡', price: 0 },
  { id: 'emotion_shield', name: '情绪护盾', description: '防止情绪波动', icon: '🛡️', price: 0 },
  { id: 'double_points', name: '双倍积分卡', description: '本轮获得双倍积分', icon: '⭐', price: 0 },
];

async function getItemList(req, res) {
  try {
    successResponse(res, ITEMS, '获取道具列表成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function useItem(req, res) {
  try {
    const { itemId } = req.body;
    successResponse(res, { itemId, used: true }, '使用成功');
  } catch (error) {
    errorResponse(res, 500, '使用失败', error.message);
  }
}

module.exports = { getItemList, useItem };
