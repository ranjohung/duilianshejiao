const pool = require('../config/database');

const TABLE = 'emotion_diaries';

class EmotionDiary {
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

  static async create({ userId, emotionType, intensity, content, trigger, level }) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, emotion_type, intensity, content, trigger_scene, response_level, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, emotionType, intensity, content, trigger, level]
    );
    return result.insertId;
  }

  /**
   * 兼容旧接口：使用 emotion/content/tags 字段创建
   */
  static async createLegacy({ userId, emotion, content, tags }) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, emotion, content, tags) VALUES (?, ?, ?, ?)`,
      [userId, emotion, content || null, JSON.stringify(tags || [])]
    );
    return result.insertId;
  }
}

module.exports = { TABLE, EmotionDiary };
