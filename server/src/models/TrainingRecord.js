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

  static async create({ userId, coachId, sceneId, messages = [], score = 0, duration = 0 }) {
    const [result] = await pool.execute(
      `INSERT INTO training_records (user_id, coach_id, scene_id, messages, score, duration, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId, coachId, sceneId,
        JSON.stringify(messages || []),
        Number.isFinite(Number(score)) ? Number(score) : 0,
        Math.max(0, Number(duration) || 0),
      ]
    );
    return result.insertId;
  }

  static async findByIdForUser(id, userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM training_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
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
