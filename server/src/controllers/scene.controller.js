const { successResponse, errorResponse } = require('../utils/response');
const Scene = require('../models/Scene');
const presetScenes = require('../data/presetScenes');

// 阶段顺序与解锁依赖链
const STAGE_ORDER = ['破冰期', '熟悉期', '亲密期', '职场期'];

/**
 * 解析场景记录中的JSON字段
 */
function parseJsonFields(item) {
  if (item.teaching_points && typeof item.teaching_points === 'string') {
    try { item.teaching_points = JSON.parse(item.teaching_points); } catch {}
  }
  if (item.unlock_condition && typeof item.unlock_condition === 'string') {
    try { item.unlock_condition = JSON.parse(item.unlock_condition); } catch {}
  }
  if (item.rounds && typeof item.rounds === 'string') {
    try { item.rounds = JSON.parse(item.rounds); } catch {}
  }
  return item;
}

/**
 * 获取所有场景（合并数据库+预设，去重）
 */
function getAllScenes() {
  return presetScenes;
}

/**
 * 根据id查找场景（先查预设，再查数据库）
 */
function findSceneById(id) {
  const preset = presetScenes.find((s) => s.id === id);
  if (preset) return preset;
  return null;
}

/**
 * 获取场景列表
 * 先查数据库，空则返回presetScenes
 */
exports.listScenes = async (req, res) => {
  try {
    const dbScenes = await Scene.findAll();

    if (dbScenes && dbScenes.length > 0) {
      const items = dbScenes.map(parseJsonFields);
      return successResponse(res, items, '获取场景列表成功');
    }

    const presetList = presetScenes.map(({ rounds, ...sceneInfo }) => sceneInfo);
    successResponse(res, presetList, '获取场景列表成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 获取场景详情（含rounds数据）
 */
exports.getScene = async (req, res) => {
  try {
    const { id } = req.params;

    let scene = await Scene.findById(id);
    if (scene) {
      parseJsonFields(scene);
      return successResponse(res, scene, '获取场景详情成功');
    }

    const preset = findSceneById(id);
    if (!preset) return errorResponse(res, 404, '场景不存在');

    successResponse(res, preset, '获取场景详情成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 获取预设场景列表
 */
exports.getPresets = async (req, res) => {
  try {
    successResponse(res, presetScenes, '获取预设场景成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 按阶段分组获取场景
 * 每个阶段包含场景列表及当前用户的解锁状态
 */
exports.getGroupedByStage = async (req, res) => {
  try {
    const userId = req.user.id;
    const completedIds = await Scene.getCompletedSceneIdsByUser(userId);

    // 收集所有场景来源（预设 + 数据库）
    let allScenes;
    const dbScenes = await Scene.findAll();

    if (dbScenes && dbScenes.length > 0) {
      allScenes = dbScenes.map(parseJsonFields);
    } else {
      allScenes = presetScenes;
    }

    // 按阶段分组
    const grouped = {};
    for (const stage of STAGE_ORDER) {
      grouped[stage] = [];
    }

    for (const scene of allScenes) {
      const stage = scene.stage;
      if (!grouped[stage]) grouped[stage] = [];
      // 列表不含rounds详情
      const { rounds, ...sceneInfo } = scene;
      sceneInfo.completed = completedIds.includes(scene.id);
      grouped[stage].push(sceneInfo);
    }

    // 计算每个阶段的解锁状态
    const result = STAGE_ORDER.map((stage, index) => {
      const scenes = grouped[stage] || [];
      const prevStage = index > 0 ? STAGE_ORDER[index - 1] : null;
      let unlocked = true;

      if (index > 0 && prevStage) {
        // 非第一阶段：需要前一阶段至少完成1个场景
        const prevCompletedCount = await Scene.countCompletedByUserAndStage(userId, prevStage);
        unlocked = prevCompletedCount >= 1;
      }

      return {
        stage,
        unlocked,
        scenes,
      };
    });

    successResponse(res, result, '获取阶段分组场景成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 检查场景是否解锁
 * 解锁逻辑：阶段一免费，后续阶段需前置阶段至少完成1个场景
 */
exports.checkUnlock = async (req, res) => {
  try {
    const { sceneId } = req.params;
    const userId = req.user.id;

    // 查找场景
    let scene = await Scene.findById(sceneId);
    if (scene) parseJsonFields(scene);
    if (!scene) scene = findSceneById(sceneId);
    if (!scene) return errorResponse(res, 404, '场景不存在');

    const stageIndex = STAGE_ORDER.indexOf(scene.stage);
    if (stageIndex === -1) {
      return errorResponse(res, 400, '场景阶段信息无效');
    }

    // 阶段一（index === 0）免费解锁
    if (stageIndex === 0) {
      return successResponse(res, { sceneId, stage: scene.stage, unlocked: true }, '场景已解锁');
    }

    // 后续阶段：前置阶段至少完成1个场景
    const prevStage = STAGE_ORDER[stageIndex - 1];
    const completedCount = await Scene.countCompletedByUserAndStage(userId, prevStage);
    const unlocked = completedCount >= 1;

    successResponse(
      res,
      {
        sceneId,
        stage: scene.stage,
        unlocked,
        requirement: unlocked ? null : `需要先完成「${prevStage}」中至少1个场景`,
      },
      unlocked ? '场景已解锁' : '场景未解锁'
    );
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.startScene = async (req, res) => {
  try {
    // TODO: 实现开始场景训练逻辑
    successResponse(res, null, '开始场景训练成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};
