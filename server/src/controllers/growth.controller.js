const GrowthProfile = require('../models/GrowthProfile');
const User = require('../models/User');
const Item = require('../models/Item');
const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// 学员等级定义
const STUDENT_LEVELS = [
  { name: 'bronze', label: '青铜', minPoints: 0 },
  { name: 'silver', label: '白银', minPoints: 100 },
  { name: 'gold', label: '黄金', minPoints: 300 },
  { name: 'platinum', label: '铂金', minPoints: 600 },
  { name: 'diamond', label: '钻石', minPoints: 1000 },
  { name: 'master', label: '大师', minPoints: 2000 },
];

function getStudentLevel(totalPoints) {
  let level = STUDENT_LEVELS[0];
  for (const l of STUDENT_LEVELS) {
    if (totalPoints >= l.minPoints) level = l;
  }
  return level;
}

// 获取成长档案（五维度分数+积分+等级+里程碑）
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [profile, user, unlockedMilestones] = await Promise.all([
      GrowthProfile.findByUser(userId),
      User.findById(userId),
      getUnlockedMilestones(userId),
    ]);

    const dimensions = {
      social_confidence: profile?.social_confidence || 50,
      expression_ability: profile?.expression_ability || 50,
      emotional_intelligence: profile?.emotional_intelligence || 50,
      empathy_score: profile?.empathy_score || 50,
      adaptability_score: profile?.adaptability_score || 50,
    };

    const level = getStudentLevel(user?.total_points || 0);

    successResponse(res, {
      dimensions,
      trainingPoints: user?.training_points || 0,
      totalPoints: user?.total_points || 0,
      studentLevel: level,
      totalTrainingTime: profile?.total_training_time || 0,
      totalSessions: profile?.total_sessions || 0,
      milestones: unlockedMilestones,
    }, '获取成长档案成功');
  } catch (err) {
    errorResponse(res, 500, '获取成长档案失败');
  }
};

// 获取里程碑列表
exports.getMilestones = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getUnlockedMilestones(userId);
    successResponse(res, data);
  } catch (err) {
    errorResponse(res, 500, '获取里程碑失败');
  }
};

// 更新五维度分数（训练后调用）
exports.updateDimensions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { social_confidence, expression_ability, emotional_intelligence, empathy_score, adaptability_score, total_training_time, total_sessions } = req.body;

    const deltaScores = {};
    if (social_confidence) deltaScores.social_confidence = social_confidence;
    if (expression_ability) deltaScores.expression_ability = expression_ability;
    if (emotional_intelligence) deltaScores.emotional_intelligence = emotional_intelligence;
    if (empathy_score) deltaScores.empathy_score = empathy_score;
    if (adaptability_score) deltaScores.adaptability_score = adaptability_score;
    if (total_training_time) deltaScores.total_training_time = total_training_time;
    if (total_sessions) deltaScores.total_sessions = total_sessions;

    if (Object.keys(deltaScores).length === 0) {
      return errorResponse(res, 400, '未提供需要更新的维度');
    }

    const updated = await GrowthProfile.addDimensionScores(userId, deltaScores);

    // 检查是否达成新里程碑
    const newMilestones = await checkAndUnlockMilestones(userId, updated);

    successResponse(res, {
      dimensions: {
        social_confidence: updated.social_confidence,
        expression_ability: updated.expression_ability,
        emotional_intelligence: updated.emotional_intelligence,
        empathy_score: updated.empathy_score,
        adaptability_score: updated.adaptability_score || 50,
      },
      newMilestones,
    }, '维度更新成功');
  } catch (err) {
    errorResponse(res, 500, '更新维度失败');
  }
};

// 获取情绪日记
exports.getDiary = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      'SELECT * FROM emotion_diaries WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    successResponse(res, rows, '获取情绪日记成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

// 创建情绪日记
exports.createDiary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emotion, content, tags } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO emotion_diaries (user_id, emotion, content, tags) VALUES (?, ?, ?, ?)`,
      [userId, emotion, content || null, JSON.stringify(tags || [])]
    );
    successResponse(res, { id: result.insertId }, '创建情绪日记成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

// 获取学习卡片
exports.getLearningCards = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      'SELECT * FROM learning_cards WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    successResponse(res, rows, '获取学习卡片成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

// 获取周进步数据（五维度本周vs上周对比）
exports.getWeeklyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await GrowthProfile.findByUser(userId);

    // 维度键名映射
    const dimensionKeys = [
      'social_confidence', 'expression_ability',
      'emotional_intelligence', 'empathy_score', 'adaptability_score',
    ];

    // 获取最近7天的训练记录
    const [recentRows] = await pool.execute(
      `SELECT scores FROM training_records WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId]
    );

    // 获取之前7天的训练记录
    const [prevRows] = await pool.execute(
      `SELECT scores FROM training_records WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId]
    );

    // 计算平均分数
    const calcAvg = (rows) => {
      if (rows.length === 0) return null;
      const sums = {};
      let count = 0;
      for (const row of rows) {
        try {
          const scores = typeof row.scores === 'string' ? JSON.parse(row.scores) : row.scores;
          if (scores) {
            for (const key of dimensionKeys) {
              if (scores[key] !== undefined) {
                sums[key] = (sums[key] || 0) + scores[key];
              }
            }
            count++;
          }
        } catch (_) { /* skip invalid json */ }
      }
      if (count === 0) return null;
      const avg = {};
      for (const key of dimensionKeys) {
        avg[key] = sums[key] !== undefined ? Math.round(sums[key] / count) : null;
      }
      return avg;
    };

    const recentAvg = calcAvg(recentRows);
    const prevAvg = calcAvg(prevRows);

    // 计算周变化量
    const weeklyChange = {};
    for (const key of dimensionKeys) {
      const r = recentAvg?.[key] ?? profile?.[key] ?? 50;
      const p = prevAvg?.[key] ?? r;
      weeklyChange[key] = r - p;
    }

    successResponse(res, { weeklyChange }, '获取周进步成功');
  } catch (err) {
    errorResponse(res, 500, '获取周进步失败');
  }
};

// 获取进步曲线（近30天每日平均分）
exports.getProgressCurve = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = Math.min(parseInt(req.query.days) || 30, 90);

    const [rows] = await pool.execute(
      `SELECT DATE(created_at) AS date, scores FROM training_records
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY created_at ASC`,
      [userId, days]
    );

    // 按日期分组计算平均分
    const dailyMap = {};
    for (const row of rows) {
      try {
        const scores = typeof row.scores === 'string' ? JSON.parse(row.scores) : row.scores;
        if (!scores) continue;
        const dateKey = row.date;
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = { sum: {}, count: 0 };
        }
        const dimensionKeys = ['social_confidence', 'expression_ability', 'emotional_intelligence', 'empathy_score', 'adaptability_score'];
        for (const key of dimensionKeys) {
          if (scores[key] !== undefined) {
            dailyMap[dateKey].sum[key] = (dailyMap[dateKey].sum[key] || 0) + scores[key];
          }
        }
        dailyMap[dateKey].count++;
      } catch (_) { /* skip */ }
    }

    // 构建曲线数据
    const curve = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const entry = dailyMap[dateKey];
      if (entry && entry.count > 0) {
        const avg = {};
        const dimensionKeys = ['social_confidence', 'expression_ability', 'emotional_intelligence', 'empathy_score', 'adaptability_score'];
        for (const key of dimensionKeys) {
          avg[key] = entry.sum[key] !== undefined ? Math.round(entry.sum[key] / entry.count) : null;
        }
        const total = Object.values(avg).filter(v => v !== null);
        avg.average = total.length > 0 ? Math.round(total.reduce((a, b) => a + b, 0) / total.length) : 0;
        curve.push({ date: dateKey, ...avg });
      } else {
        curve.push({ date: dateKey, average: null });
      }
    }

    successResponse(res, { curve, days }, '获取进步曲线成功');
  } catch (err) {
    errorResponse(res, 500, '获取进步曲线失败');
  }
};

// ========== 辅助函数 ==========

async function getUnlockedMilestones(userId) {
  const [allMilestones] = await pool.execute(
    'SELECT * FROM milestones WHERE is_active = 1 ORDER BY sort_order'
  );
  const [unlocked] = await pool.execute(
    'SELECT milestone_id, unlocked_at FROM user_milestones WHERE user_id = ?',
    [userId]
  );
  const unlockedMap = new Map(unlocked.map(u => [u.milestone_id, u.unlocked_at]));

  return allMilestones.map(m => ({
    ...m,
    unlocked: unlockedMap.has(m.id),
    unlockedAt: unlockedMap.get(m.id) || null,
  }));
}

async function checkAndUnlockMilestones(userId, profile) {
  const user = await User.findById(userId);
  const [milestones] = await pool.execute(
    'SELECT m.* FROM milestones m WHERE m.is_active = 1 AND m.id NOT IN (SELECT milestone_id FROM user_milestones WHERE user_id = ?)',
    [userId]
  );

  const newlyUnlocked = [];

  for (const m of milestones) {
    let met = false;
    switch (m.condition_type) {
      case 'total_sessions':
        met = (profile.total_sessions || 0) >= m.condition_value;
        break;
      case 'social_confidence':
        met = (profile.social_confidence || 50) >= m.condition_value;
        break;
      case 'expression_ability':
        met = (profile.expression_ability || 50) >= m.condition_value;
        break;
      case 'emotional_intelligence':
        met = (profile.emotional_intelligence || 50) >= m.condition_value;
        break;
      case 'empathy_score':
        met = (profile.empathy_score || 50) >= m.condition_value;
        break;
      case 'total_points':
        met = (user.total_points || 0) >= m.condition_value;
        break;
      case 'streak_days':
        met = (user.streak_days || 0) >= m.condition_value;
        break;
    }

    if (met) {
      await pool.execute(
        'INSERT INTO user_milestones (user_id, milestone_id) VALUES (?, ?)',
        [userId, m.id]
      );
      // 发放奖励
      if (m.reward_points > 0) {
        await User.addTrainingPoints(userId, m.reward_points);
      }
      if (m.reward_item_type && m.reward_item_quantity > 0) {
        await Item.grantItem(userId, m.reward_item_type, m.reward_item_quantity);
      }
      newlyUnlocked.push(m);
    }
  }

  return newlyUnlocked;
}
