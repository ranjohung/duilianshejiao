const RealChallenge = require('../models/RealChallenge');
const Talent = require('../models/Talent');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * 获取本周挑战列表
 */
exports.getChallenges = async (req, res) => {
  try {
    const challenges = await RealChallenge.findWeekly();
    successResponse(res, challenges, '获取本周挑战成功');
  } catch (err) {
    errorResponse(res, 500, '获取挑战列表失败');
  }
};

/**
 * 开始挑战
 */
exports.startChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeType } = req.body;

    if (!challengeType) {
      return errorResponse(res, 400, '缺少必要参数：challengeType');
    }

    const challengeInfo = RealChallenge.getChallengeType(challengeType);
    if (!challengeInfo) {
      return errorResponse(res, 400, `无效的挑战类型：${challengeType}`);
    }

    // 创建挑战记录（状态为pending，等待用户完成后打卡）
    const challengeId = await RealChallenge.create({
      userId,
      challengeType,
      description: '',
      evidence: null,
    });

    successResponse(res, {
      challengeId,
      challengeType,
      label: challengeInfo.label,
      category: challengeInfo.category,
    }, '挑战已开始，完成后请打卡');
  } catch (err) {
    errorResponse(res, 500, '开始挑战失败');
  }
};

/**
 * 完成挑战（文字描述+可选图片+AI验证）
 */
exports.completeChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { description, evidence } = req.body;

    if (!description || description.trim().length < 10) {
      return errorResponse(res, 400, '请至少描述10字以上的挑战经历');
    }

    // 查找挑战记录
    const challenge = await RealChallenge.findById(id);
    if (!challenge) {
      return errorResponse(res, 404, '挑战记录不存在');
    }
    if (challenge.user_id !== userId) {
      return errorResponse(res, 403, '无权操作此挑战');
    }
    if (challenge.status === 'verified') {
      return errorResponse(res, 400, '挑战已完成，不可重复打卡');
    }

    // AI验证：简单规则验证（描述长度、关键词匹配等）
    const challengeInfo = RealChallenge.getChallengeType(challenge.challenge_type);
    const aiVerified = verifyChallenge(description, challengeInfo);

    // 更新挑战描述和证据
    await RealChallenge.verify(id, aiVerified);

    if (aiVerified) {
      // 验证通过，发放奖励：20积分 + 才艺经验
      const expReward = challengeInfo ? challengeInfo.expReward : 20;
      const talentReward = challengeInfo ? challengeInfo.talentReward : 'speech';

      await User.addTrainingPoints(userId, 20);
      await Talent.addExperience(userId, talentReward, expReward);

      successResponse(res, {
        verified: true,
        pointsReward: 20,
        talentReward,
        expReward,
      }, '挑战验证通过！奖励已发放');
    } else {
      successResponse(res, {
        verified: false,
        reason: '描述内容与挑战不够匹配，请补充更多细节后重新提交',
      }, '挑战验证未通过，请补充描述');
    }
  } catch (err) {
    errorResponse(res, 500, '完成挑战失败');
  }
};

/**
 * 获取用户的挑战记录
 */
exports.getMyChallenges = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const records = await RealChallenge.findByUser(userId, { page, pageSize });
    successResponse(res, records, '获取挑战记录成功');
  } catch (err) {
    errorResponse(res, 500, '获取挑战记录失败');
  }
};

// ========== 辅助函数 ==========

/**
 * 简单AI验证逻辑
 * 验证描述是否与挑战类型匹配
 */
function verifyChallenge(description, challengeInfo) {
  if (!challengeInfo) return false;
  const desc = description.trim();

  // 基本条件：描述至少20字
  if (desc.length < 20) return false;

  // 关键词匹配规则
  const keywordMap = {
    social_greeting: ['打招呼', '陌生人', '主动', '聊', '说', '认识', '你好', '嗨'],
    public_speak: ['发言', '讲话', '演讲', '表达', '众人', '会议', '上台', '分享'],
    negotiate_price: ['砍价', '讲价', '便宜', '折扣', '优惠', '还价', '价格', '成交'],
    complaint_service: ['投诉', '客服', '问题', '退款', '不满', '维权', '解决', '处理'],
    comfort_friend: ['安慰', '朋友', '难过', '伤心', '陪伴', '倾听', '支持', '鼓励'],
    humor_joke: ['笑话', '搞笑', '逗笑', '幽默', '开心', '笑', '有趣', '段子'],
    write_diary: ['日记', '心情', '感受', '思考', '反思', '记录', '写下', '文字'],
    salary_talk: ['加薪', '薪资', '工资', '领导', '谈', '涨薪', '收入', '老板'],
  };

  const keywords = keywordMap[challengeInfo.key] || [];
  const matchCount = keywords.filter(kw => desc.includes(kw)).length;

  // 至少匹配1个关键词
  return matchCount >= 1;
}
