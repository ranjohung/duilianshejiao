const pool = require('../config/database');

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
      'SELECT DISTINCT scene_id FROM training_records WHERE user_id = ? AND status = ?',
      [userId, 'completed']
    );
    return rows.map(r => r.scene_id);
  }

  static async countCompletedByUserAndStage(userId, stage) {
    const [rows] = await pool.execute(
      `SELECT COUNT(DISTINCT tr.scene_id) as count
       FROM training_records tr
       JOIN scenes s ON tr.scene_id = s.id
       WHERE tr.user_id = ? AND tr.status = ? AND s.stage = ?`,
      [userId, 'completed', stage]
    );
    return rows[0].count || 0;
  }

  static async checkUnlock(sceneId, userId) {
    let scene = await this.findById(sceneId);
    if (!scene) return { unlocked: false, reason: '场景不存在' };

    const parsedCondition = typeof scene.unlock_condition === 'string'
      ? JSON.parse(scene.unlock_condition)
      : scene.unlock_condition;

    const [userRows] = await pool.execute(
      'SELECT points, level FROM users WHERE id = ?',
      [userId]
    );
    if (userRows.length === 0) return { unlocked: false, reason: '用户不存在' };

    const user = userRows[0];
    const userLevelIndex = LEVELS.indexOf(user.level || 'bronze');
    const requiredLevelIndex = LEVELS.indexOf(parsedCondition.min_level || 'bronze');

    let unlocked = true;
    let reason = '';

    if (user.points < (parsedCondition.min_points || 0)) {
      unlocked = false;
      reason = `需要 ${parsedCondition.min_points} 积分`;
    }

    if (userLevelIndex < requiredLevelIndex) {
      unlocked = false;
      reason = `需要 ${parsedCondition.min_level} 等级`;
    }

    return {
      unlocked,
      reason: unlocked ? '' : reason,
      min_points: parsedCondition.min_points || 0,
      min_level: parsedCondition.min_level || 'bronze',
      user_points: user.points,
      user_level: user.level,
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
