const Talent = require('../models/Talent');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * 获取用户才艺列表（含等级）
 */
exports.getTalents = async (req, res) => {
  try {
    const userId = req.user.id;
    const talents = await Talent.getTalentListWithLevels(userId);
    successResponse(res, talents, '获取才艺列表成功');
  } catch (err) {
    errorResponse(res, 500, '获取才艺列表失败');
  }
};

/**
 * 更新才艺经验值
 */
exports.updateTalentExp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { talentType, exp } = req.body;

    if (!talentType || !exp) {
      return errorResponse(res, 400, '缺少必要参数：talentType, exp');
    }

    // 验证才艺类型
    const validType = Talent.TALENT_TYPES.find(t => t.key === talentType);
    if (!validType) {
      return errorResponse(res, 400, `无效的才艺类型：${talentType}`);
    }

    if (exp <= 0 || exp > 100) {
      return errorResponse(res, 400, '经验值范围：1-100');
    }

    const result = await Talent.addExperience(userId, talentType, exp);
    const level = Talent.getTalentLevel(result.experience);

    successResponse(res, {
      talentType,
      experience: result.experience,
      level: level.name,
    }, '才艺经验更新成功');
  } catch (err) {
    errorResponse(res, 500, '更新才艺经验失败');
  }
};

/**
 * 获取才艺等级定义
 */
exports.getTalentLevels = async (req, res) => {
  try {
    successResponse(res, {
      types: Talent.TALENT_TYPES,
      levels: Talent.TALENT_LEVELS,
    }, '获取才艺等级成功');
  } catch (err) {
    errorResponse(res, 500, '获取才艺等级失败');
  }
};
