const { successResponse, errorResponse } = require('../utils/response');
const Scene = require('../models/Scene');
const presetScenes = require('../data/presetScenes');

const STAGE_ORDER = ['破冰期', '熟悉期', '亲密期', '职场期'];

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

function findSceneById(id) {
  const preset = presetScenes.find((s) => s.id === id);
  if (preset) return preset;
  return null;
}

exports.listScenes = async (req, res) => {
  try {
    const userId = req.user?.id;
    const dbScenes = await Scene.findAll();

    let allScenes;
    if (dbScenes && dbScenes.length > 0) {
      allScenes = dbScenes.map(parseJsonFields);
    } else {
      allScenes = [...presetScenes];
    }

    const sceneList = [];
    for (const scene of allScenes) {
      const { rounds, ...sceneInfo } = scene;
      let unlocked = true;
      let unlockReason = '';

      if (userId) {
        const unlockResult = await Scene.checkUnlock(scene.id, userId);
        unlocked = unlockResult.unlocked;
        unlockReason = unlockResult.reason;
      }

      sceneList.push({
        ...sceneInfo,
        unlocked,
        unlockReason,
      });
    }

    successResponse(res, sceneList, '获取场景列表成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

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

exports.getPresets = async (req, res) => {
  try {
    successResponse(res, presetScenes, '获取预设场景成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.getGroupedByStage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const completedIds = userId ? await Scene.getCompletedSceneIdsByUser(userId) : [];

    let allScenes;
    const dbScenes = await Scene.findAll();
    if (dbScenes && dbScenes.length > 0) {
      allScenes = dbScenes.map(parseJsonFields);
    } else {
      allScenes = [...presetScenes];
    }

    const grouped = {};
    for (const stage of STAGE_ORDER) {
      grouped[stage] = [];
    }

    for (const scene of allScenes) {
      const stage = scene.stage;
      if (!grouped[stage]) grouped[stage] = [];
      const { rounds, ...sceneInfo } = scene;

      let unlocked = true;
      let unlockReason = '';

      if (userId) {
        const unlockResult = await Scene.checkUnlock(scene.id, userId);
        unlocked = unlockResult.unlocked;
        unlockReason = unlockResult.reason;
      }

      sceneInfo.completed = completedIds.includes(scene.id);
      sceneInfo.unlocked = unlocked;
      sceneInfo.unlockReason = unlockReason;

      grouped[stage].push(sceneInfo);
    }

    const result = [];
    for (let index = 0; index < STAGE_ORDER.length; index++) {
      const stage = STAGE_ORDER[index];
      const scenes = grouped[stage] || [];
      let unlocked = true;

      if (index > 0 && userId) {
        const prevStage = STAGE_ORDER[index - 1];
        const prevCompletedCount = await Scene.countCompletedByUserAndStage(userId, prevStage);
        unlocked = prevCompletedCount >= 1;
      }

      result.push({
        stage,
        unlocked,
        scenes,
      });
    }

    successResponse(res, result, '获取阶段分组场景成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.checkUnlock = async (req, res) => {
  try {
    const { sceneId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return successResponse(res, { sceneId, unlocked: false, reason: '请先登录' });
    }

    let scene = await Scene.findById(sceneId);
    if (scene) parseJsonFields(scene);
    if (!scene) scene = findSceneById(sceneId);
    if (!scene) return errorResponse(res, 404, '场景不存在');

    const unlockResult = await Scene.checkUnlock(sceneId, userId);

    successResponse(
      res,
      {
        sceneId,
        stage: scene.stage,
        ...unlockResult,
      },
      unlockResult.unlocked ? '场景已解锁' : '场景未解锁'
    );
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.startScene = async (req, res) => {
  try {
    const { sceneId } = req.params;
    const userId = req.user?.id;
    const { coachId, mode = 'text' } = req.body;

    if (!userId) {
      return errorResponse(res, 401, '请先登录');
    }

    let scene = await Scene.findById(sceneId);
    if (scene) parseJsonFields(scene);
    if (!scene) scene = findSceneById(sceneId);
    if (!scene) return errorResponse(res, 404, '场景不存在');

    const unlockResult = await Scene.checkUnlock(sceneId, userId);
    if (!unlockResult.unlocked) {
      return errorResponse(res, 403, unlockResult.reason);
    }

    const TrainingController = require('./training.controller');
    const result = await TrainingController.startTraining({
      body: { coachId, sceneId, mode },
      user: { id: userId },
    });

    if (result.success) {
      successResponse(res, result.data, result.message);
    } else {
      errorResponse(res, result.code || 500, result.message);
    }
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};