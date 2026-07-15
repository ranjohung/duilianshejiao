const Coach = require('../models/Coach');
const { successResponse, errorResponse } = require('../utils/response');

// 预设教练配置
const PRESET_COACHES = [
  {
    id: 'shen_qinghuan',
    name: '沈清欢',
    avatar: '/avatars/shen_qinghuan.png',
    personality_type: '温和引导型',
    teaching_style: '鼓励式',
    personality_config: {
      traits: { warmth: 9, professionalism: 7, humor: 6, directness: 3 },
      description: '温暖治愈系，善于倾听和共情',
    },
    specialty: '社交焦虑 · 沟通表达 · 自信建立',
    type: 'empathy',
  },
  {
    id: 'lu_beichen',
    name: '陆北辰',
    avatar: '/avatars/lu_beichen.png',
    personality_type: '理性分析型',
    teaching_style: '引导式',
    personality_config: {
      traits: { warmth: 5, professionalism: 9, humor: 4, directness: 8 },
      description: '冷静理性，善于分析和拆解问题',
    },
    specialty: '逻辑沟通 · 谈判技巧 · 冲突处理',
    type: 'analytical',
  },
  {
    id: 'gu_xinghe',
    name: '顾星河',
    avatar: '/avatars/gu_xinghe.png',
    personality_type: '幽默风趣型',
    teaching_style: '互动式',
    personality_config: {
      traits: { warmth: 7, professionalism: 6, humor: 9, directness: 5 },
      description: '幽默风趣，善于化解尴尬和紧张',
    },
    specialty: '破冰技巧 · 幽默表达 · 社交氛围',
    type: 'humorous',
  },
  {
    id: 'su_nian',
    name: '苏念',
    avatar: '/avatars/su_nian.png',
    personality_type: '细腻观察型',
    teaching_style: '陪伴式',
    personality_config: {
      traits: { warmth: 8, professionalism: 8, humor: 5, directness: 4 },
      description: '细腻温柔，善于观察微表情和情绪',
    },
    specialty: '情绪管理 · 亲密关系 · 边界设定',
    type: 'observant',
  },
];

/**
 * 获取所有教练列表
 */
exports.list = async (req, res) => {
  try {
    const coaches = await Coach.findAll();
    successResponse(res, coaches, '获取教练列表成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 获取教练详情
 */
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const coach = await Coach.getFullProfile(id);
    if (!coach) return errorResponse(res, 404, '教练不存在');
    successResponse(res, coach, '获取教练详情成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

/**
 * 获取4个预设教练
 */
exports.getPresets = async (req, res) => {
  try {
    successResponse(res, PRESET_COACHES, '获取预设教练成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

// 兼容旧接口
exports.listCoaches = exports.list;
exports.getCoach = exports.getDetail;
exports.chat = async (req, res) => {
  try {
    successResponse(res, null, '请使用 training 接口进行对话');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};
