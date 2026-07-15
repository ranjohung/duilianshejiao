const pool = require('../config/database');

const TABLE = 'learning_cards';

class LearningCard {
  static async findByUserId(userId, { page = 1, pageSize = 10 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    return rows;
  }

  static async countByUserId(userId) {
    const [result] = await pool.execute(
      `SELECT COUNT(*) as total FROM ${TABLE} WHERE user_id = ?`,
      [userId]
    );
    return result[0].total;
  }

  static async create({ userId, sceneId, title, keyPoints, improvementAdvice }) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, scene_id, title, key_points, improvement_advice, is_favorite, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [userId, sceneId, title, JSON.stringify(keyPoints), JSON.stringify(improvementAdvice)]
    );
    return result.insertId;
  }

  static async toggleFavorite(id) {
    await pool.execute(
      `UPDATE ${TABLE} SET is_favorite = !is_favorite WHERE id = ?`,
      [id]
    );
  }
}

module.exports = { TABLE, LearningCard };
