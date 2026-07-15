const { successResponse, errorResponse } = require('../utils/response');
const Scene = require('../models/Scene');
const presetScenes = require('../data/presetScenes');

/**
 * 获取场景列表
 * 先查数据库，空则返回presetScenes
 */
exports.listScenes = async (req, res) => {
  try {
    const dbScenes = await Scene.findAll();

    if (dbScenes && dbScenes.length > 0) {
      // 解析JSON字段
      const items = dbScenes.map((item) => {
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
      });
      return successResponse(res, items, '获取场景列表成功');
    }

    // 数据库为空，返回预设场景（不含rounds详情）
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

    // 先查数据库
    let scene = await Scene.findById(id);
    if (scene) {
      if (scene.teaching_points && typeof scene.teaching_points === 'string') {
        try { scene.teaching_points = JSON.parse(scene.teaching_points); } catch {}
      }
      if (scene.unlock_condition && typeof scene.unlock_condition === 'string') {
        try { scene.unlock_condition = JSON.parse(scene.unlock_condition); } catch {}
      }
      if (scene.rounds && typeof scene.rounds === 'string') {
        try { scene.rounds = JSON.parse(scene.rounds); } catch {}
      }
      return successResponse(res, scene, '获取场景详情成功');
    }

    // 查预设场景
    const preset = presetScenes.find((s) => s.id === id);
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

exports.startScene = async (req, res) => {
  try {
    // TODO: 实现开始场景训练逻辑
    successResponse(res, null, '开始场景训练成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};
