const pool = require('../config/database');

const TABLE = 'scenes';

module.exports = {
  TABLE,
  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
    return rows[0] || null;
  },
  async findAll() {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE}`);
    return rows;
  },
  async findByStage(stage) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE stage = ?`, [stage]);
    return rows;
  },
  async findByDifficulty(difficulty) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE difficulty = ?`, [difficulty]);
    return rows;
  },
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (id, name, stage, difficulty, description, total_rounds, unlock_condition, teaching_points, npc_name, npc_avatar, opening, rounds, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.id,
        data.name,
        data.stage,
        data.difficulty,
        data.description,
        data.total_rounds,
        JSON.stringify(data.unlock_condition || {}),
        JSON.stringify(data.teaching_points || []),
        data.npc_name,
        data.npc_avatar,
        data.opening,
        JSON.stringify(data.rounds || []),
      ]
    );
    return result.insertId;
  },
  async update(id, data) {
    const fields = [];
    const values = [];
    const allowedFields = ['name', 'stage', 'difficulty', 'description', 'total_rounds', 'npc_name', 'npc_avatar', 'opening'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    if (data.unlock_condition !== undefined) {
      fields.push('unlock_condition = ?');
      values.push(JSON.stringify(data.unlock_condition));
    }
    if (data.teaching_points !== undefined) {
      fields.push('teaching_points = ?');
      values.push(JSON.stringify(data.teaching_points));
    }
    if (data.rounds !== undefined) {
      fields.push('rounds = ?');
      values.push(JSON.stringify(data.rounds));
    }
    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    values.push(id);
    await pool.execute(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
  },
  async deleteById(id) {
    const [result] = await pool.execute(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },
  /**
   * 获取用户在某阶段已完成的场景数量
   */
  async countCompletedByUserAndStage(userId, stage) {
    const [rows] = await pool.execute(
      `SELECT COUNT(DISTINCT tr.scene_id) as count
       FROM training_records tr
       JOIN ${TABLE} s ON tr.scene_id = s.id
       WHERE tr.user_id = ? AND s.stage = ? AND tr.status = 'completed'`,
      [userId, stage]
    );
    return rows[0].count;
  },
  /**
   * 获取用户已完成的场景ID列表
   */
  async getCompletedSceneIdsByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT DISTINCT scene_id FROM training_records WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );
    return rows.map((r) => r.scene_id);
  },
  /**
   * 获取所有不重复的阶段列表
   */
  async findDistinctStages() {
    const [rows] = await pool.execute(`SELECT DISTINCT stage FROM ${TABLE} ORDER BY stage`);
    return rows.map((r) => r.stage);
  },
};
