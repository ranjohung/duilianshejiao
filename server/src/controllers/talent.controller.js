const { successResponse, errorResponse } = require('../utils/response');
const Talent = require('../models/Talent');
const User = require('../models/User');

async function getUserTalents(req, res) {
  try {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20 } = req.query;

    const userTalents = await Talent.findByUserId(userId, { page: parseInt(page), pageSize: parseInt(pageSize) });
    const presetTalents = await Talent.getPresetTalents();

    const talents = userTalents.items.map(talent => {
      const preset = presetTalents.find(t => t.name === talent.name);
      return {
        ...talent,
        base_effect: preset?.base_effect || {},
      };
    });

    successResponse(res, { talents, total: userTalents.total }, '获取天赋列表成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function unlockTalent(req, res) {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    if (user.total_points < 100) {
      return errorResponse(res, 400, '积分不足，需要100积分解锁天赋');
    }

    const unlocked = await Talent.unlockRandomTalent(userId);

    if (!unlocked) {
      return errorResponse(res, 400, '已解锁所有天赋');
    }

    await User.updatePoints(userId, -100);

    successResponse(res, unlocked, '解锁天赋成功');
  } catch (error) {
    errorResponse(res, 500, '解锁失败', error.message);
  }
}

async function upgradeTalent(req, res) {
  try {
    const userId = req.user?.id;
    const { talentId } = req.params;

    const talent = await Talent.findById(talentId);
    if (!talent) {
      return errorResponse(res, 404, '天赋不存在');
    }

    if (talent.user_id !== userId) {
      return errorResponse(res, 403, '无权操作该天赋');
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    const upgradeCost = talent.level * 50;
    if (user.total_points < upgradeCost) {
      return errorResponse(res, 400, `积分不足，升级需要${upgradeCost}积分`);
    }

    const success = await Talent.upgrade(talentId);
    if (!success) {
      return errorResponse(res, 500, '升级失败');
    }

    await User.updatePoints(userId, -upgradeCost);

    const updatedTalent = await Talent.findById(talentId);
    const presetTalents = await Talent.getPresetTalents();
    const preset = presetTalents.find(t => t.name === updatedTalent.name);

    successResponse(res, {
      ...updatedTalent,
      base_effect: preset?.base_effect || {},
    }, '升级天赋成功');
  } catch (error) {
    errorResponse(res, 500, '升级失败', error.message);
  }
}

async function getTalentEffects(req, res) {
  try {
    const userId = req.user?.id;

    const effects = await Talent.getTalentEffects(userId);

    successResponse(res, effects, '获取天赋加成成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function getAvailableTalents(req, res) {
  try {
    const userId = req.user?.id;

    const userTalents = await Talent.findByUserId(userId);
    const presetTalents = await Talent.getPresetTalents();

    const existingNames = userTalents.items.map(t => t.name);
    const available = presetTalents.filter(t => !existingNames.includes(t.name));

    successResponse(res, { availableTalents: available, unlockedCount: existingNames.length }, '获取可解锁天赋成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

module.exports = {
  getUserTalents,
  unlockTalent,
  upgradeTalent,
  getTalentEffects,
  getAvailableTalents,
};