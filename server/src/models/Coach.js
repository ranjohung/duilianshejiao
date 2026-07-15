const pool = require('../config/database');

class Coach {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM coaches WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM coaches WHERE is_active = 1 ORDER BY sort_order');
    return rows;
  }

  static async findByType(type) {
    const [rows] = await pool.execute('SELECT * FROM coaches WHERE type = ? AND is_active = 1', [type]);
    return rows;
  }

  // 获取教练完整信息（含性格配置）
  static async getFullProfile(id) {
    const coach = await this.findById(id);
    if (!coach) return null;
    // 解析JSON字段
    if (coach.personality_config) {
      try { coach.personality_config = JSON.parse(coach.personality_config); } catch {}
    }
    if (coach.emotion_state) {
      try { coach.emotion_state = JSON.parse(coach.emotion_state); } catch {}
    }
    return coach;
  }

  // 创建自定义教练
  static async createCustom({ userId, name, personalityType, teachingStyle, personalityConfig, catchphrase }) {
    const [result] = await pool.execute(
      `INSERT INTO coaches (user_id, name, personality_type, teaching_style, personality_config, catchphrase, type, is_active, is_preset, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'custom', 1, 0, 99, NOW(), NOW())`,
      [userId, name, personalityType, teachingStyle, personalityConfig, catchphrase]
    );
    return result.insertId;
  }

  // 获取用户的自定义教练列表
  static async findByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM coaches WHERE user_id = ? AND type = ? ORDER BY created_at DESC',
      [userId, 'custom']
    );
    return rows;
  }

  // 更新自定义教练
  static async updateCustom(id, updates) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    if (fields.length === 0) return;
    fields.push('updated_at = NOW()');
    values.push(id);
    await pool.execute(`UPDATE coaches SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

module.exports = Coach;
