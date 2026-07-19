const pool = require('../config/database');

class TrainingRecord {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM training_records WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByUser(userId, { page = 1, pageSize = 10 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      'SELECT * FROM training_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, pageSize, offset]
    );
    const [count] = await pool.execute(
      'SELECT COUNT(*) as total FROM training_records WHERE user_id = ?',
      [userId]
    );
    return { items: rows, total: count[0].total };
  }

  static async create({ user_id, coach_id, scene_id, messages, score, duration, total_rounds, suggestions_history, npc_attitude_history, topics_covered, completion_reason, net_score, positive_score, negative_score, learning_card_id }) {
    const [result] = await pool.execute(
      `INSERT INTO training_records (user_id, coach_id, scene_id, messages, score, duration, total_rounds, suggestions_history, npc_attitude_history, topics_covered, completion_reason, net_score, positive_score, negative_score, learning_card_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, coach_id, scene_id,
        messages, score, duration,
        total_rounds, suggestions_history,
        npc_attitude_history, topics_covered,
        completion_reason,
        net_score || 0,
        positive_score || 0,
        negative_score || 0,
        learning_card_id || null
      ]
    );
    return result.insertId;
  }

  static async getLatestByUser(userId, limit = 5) {
    const [rows] = await pool.execute(
      'SELECT * FROM training_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }
}

module.exports = TrainingRecord;
