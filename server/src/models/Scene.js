const pool = require('../config/database');
const presetScenes = require('../data/presetScenes');
const Item = require('./Item');

const LEVELS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'];

class Scene {
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM scenes');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM scenes WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByStage(stage) {
    const [rows] = await pool.execute('SELECT * FROM scenes WHERE stage = ?', [stage]);
    return rows;
  }

  static async getCompletedSceneIdsByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT DISTINCT scene_id FROM training_records WHERE user_id = ?',
      [userId]
    );
    return rows.map(r => r.scene_id);
  }

  static async countCompletedByUserAndStage(userId, stage) {
    const [rows] = await pool.execute(
      `SELECT COUNT(DISTINCT tr.scene_id) as count
       FROM training_records tr
       JOIN scenes s ON tr.scene_id = s.id
       WHERE tr.user_id = ? AND s.stage = ?`,
      [userId, stage]
    );
    return rows[0].count || 0;
  }

  static async checkUnlock(sceneId, userId) {
    let scene = await this.findById(sceneId);
    const presetScene = presetScenes.find(item => String(item.id) === String(sceneId));
    // 初始化脚本尚未把全部预设写入 scenes，或旧表没有 unlock_condition 列时，必须回退到同一份预设条件，不能默认放行。
    if (!scene) scene = presetScene;
    else if (presetScene && !scene.unlock_condition && !scene.unlockCondition) {
      scene = { ...presetScene, ...scene, unlock_condition: presetScene.unlock_condition };
    }
    if (!scene) return { unlocked: false, reason: '场景不存在' };

    let parsedCondition = scene.unlock_condition || scene.unlockCondition || {};
    if (typeof parsedCondition === 'string') {
      try { parsedCondition = JSON.parse(parsedCondition); } catch { parsedCondition = {}; }
    }
    if (!parsedCondition || typeof parsedCondition !== 'object') parsedCondition = {};

    const requiredPoints = Math.max(0, Number(parsedCondition.min_points) || 0);
    const requiredLevel = LEVELS.includes(parsedCondition.min_level) ? parsedCondition.min_level : 'bronze';
    const requiredTickets = Math.max(0, Number(
      parsedCondition.min_tickets ?? parsedCondition.unlock_tickets ?? parsedCondition.unlockTickets ?? 0
    ) || 0);

    const [userRows] = await pool.execute(
      `SELECT u.training_points, u.total_points, u.student_level, u.member_level,
              EXISTS(
                SELECT 1 FROM memberships m
                 WHERE m.user_id = u.id
                   AND m.level = u.member_level
                   AND m.is_active = 1
                   AND m.end_date >= CURRENT_DATE
              ) AS membership_active
         FROM users u WHERE u.id = ?`,
      [userId]
    );
    if (userRows.length === 0) return { unlocked: false, reason: '用户不存在' };

    const user = userRows[0];
    const paidLevels = ['daily', 'weekly', 'monthly', 'yearly'];
    if (paidLevels.includes(user.member_level) && Number(user.membership_active) === 1) {
      return {
        unlocked: true,
        reason: '',
        min_points: requiredPoints,
        min_level: requiredLevel,
        min_tickets: requiredTickets,
        user_points: user.training_points || 0,
        user_total_points: user.total_points || 0,
        user_level: user.student_level || 'bronze',
        membership_access: true,
      };
    }

    // 等级以不可消费的累计进度积分为准，不能因客户端/旧字段 student_level 滞后而放行或拒绝。
    const totalPoints = Number(user.total_points) || 0;
    const userLevelIndex = totalPoints >= 800 ? 5
      : totalPoints >= 600 ? 4
        : totalPoints >= 400 ? 3
          : totalPoints >= 200 ? 2
            : totalPoints >= 100 ? 1 : 0;
    const requiredLevelIndex = LEVELS.indexOf(requiredLevel);
    const userTickets = requiredTickets > 0 ? await Item.getUserItemCount(userId, 'time_shuttle') : 0;

    let unlocked = true;
    let reason = '';

    if ((user.training_points || 0) < requiredPoints) {
      unlocked = false;
      reason = `需要 ${requiredPoints} 积分`;
    }

    if (userLevelIndex < requiredLevelIndex) {
      unlocked = false;
      reason = `需要 ${requiredLevel} 等级`;
    }

    if (userTickets < requiredTickets) {
      unlocked = false;
      reason = `需要 ${requiredTickets} 张时空穿梭券`;
    }

    return {
      unlocked,
      reason: unlocked ? '' : reason,
      min_points: requiredPoints,
      min_level: requiredLevel,
      min_tickets: requiredTickets,
      user_points: user.training_points || 0,
      user_total_points: user.total_points || 0,
      user_level: user.student_level || 'bronze',
      user_tickets: userTickets,
    };
  }

  static async create(sceneData) {
    const {
      id, name, stage, difficulty, description,
      total_rounds, unlock_condition, teaching_points,
      npc_name, npc_avatar, opening, rounds
    } = sceneData;

    const [result] = await pool.execute(
      `INSERT INTO scenes
       (id, name, stage, difficulty, description, total_rounds,
        unlock_condition, teaching_points, npc_name, npc_avatar,
        opening, rounds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, stage, difficulty, description, total_rounds,
        typeof unlock_condition === 'object' ? JSON.stringify(unlock_condition) : unlock_condition,
        typeof teaching_points === 'object' ? JSON.stringify(teaching_points) : teaching_points,
        npc_name, npc_avatar, opening,
        typeof rounds === 'object' ? JSON.stringify(rounds) : rounds
      ]
    );

    return result.insertId;
  }

  static async initPresetScenes(presetScenes) {
    for (const scene of presetScenes) {
      const existing = await this.findById(scene.id);
      if (!existing) {
        await this.create(scene);
      }
    }
  }
}

module.exports = Scene;
