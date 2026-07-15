const pool = require('../config/database');
const Item = require('../models/Item');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// 道具类型说明
const ITEM_EFFECTS = {
  time_shuttle: { name: '时空穿梭券', description: '重新选择对话分支，回到上一个决策点' },
  hint_card: { name: '提示卡', description: '获取教练对当前场景的额外提示' },
  shield: { name: '护盾', description: '保护一次训练评分不受扣分影响' },
  double_points: { name: '双倍积分卡', description: '下次训练获得双倍积分' },
};

// 获取道具目录
exports.listItems = async (req, res) => {
  try {
    const items = await Item.findAll();
    successResponse(res, items);
  } catch (err) {
    errorResponse(res, 500, '获取道具列表失败');
  }
};

// 获取用户道具背包
exports.getBag = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await Item.findByUser(userId);
    successResponse(res, items);
  } catch (err) {
    errorResponse(res, 500, '获取背包失败');
  }
};

// 使用道具
exports.useItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemType } = req.body;

    if (!itemType || !ITEM_EFFECTS[itemType]) {
      return errorResponse(res, 400, '无效的道具类型');
    }

    const used = await Item.useItem(userId, itemType, 1);
    if (!used) return errorResponse(res, 400, '道具不足或不存在');

    // 处理道具效果
    let effect = null;
    switch (itemType) {
      case 'double_points':
        // 设置用户双倍积分标记（下次训练时生效）
        await User.updateDoublePointsFlag(userId, true);
        effect = { message: '下次训练将获得双倍积分' };
        break;
      case 'shield':
        // 设置用户护盾标记（下次训练时生效）
        await User.updateShieldFlag(userId, true);
        effect = { message: '下次训练评分将受到保护' };
        break;
      case 'time_shuttle':
        effect = { message: '可在对话中选择回到上一个决策点' };
        break;
      case 'hint_card':
        effect = { message: '教练将提供额外提示' };
        break;
    }

    successResponse(res, { itemType, effect }, '道具使用成功');
  } catch (err) {
    errorResponse(res, 500, '使用道具失败');
  }
};

// 发放道具（内部接口：签到/会员/邀请调用）
exports.grantItem = async (req, res) => {
  try {
    const { userId, itemType, quantity = 1 } = req.body;

    if (!userId || !itemType || !ITEM_EFFECTS[itemType]) {
      return errorResponse(res, 400, '参数无效');
    }

    const result = await Item.grantItem(userId, itemType, quantity);
    if (!result) return errorResponse(res, 400, '道具类型不存在');

    successResponse(res, { userId, itemType, quantity }, '道具发放成功');
  } catch (err) {
    errorResponse(res, 500, '发放道具失败');
  }
};

// 购买道具
exports.purchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) return errorResponse(res, 404, '道具不存在');

    const user = await User.findById(userId);
    if (user.coins < item.price_coins) {
      return errorResponse(res, 400, '金币不足');
    }

    // 扣除金币
    await pool.execute('UPDATE users SET coins = coins - ? WHERE id = ?', [item.price_coins, userId]);

    // 发放道具
    await Item.grantItem(userId, item.item_type, 1);

    successResponse(res, { itemType: item.item_type, cost: item.price_coins }, '购买成功');
  } catch (err) {
    errorResponse(res, 500, '购买道具失败');
  }
};
