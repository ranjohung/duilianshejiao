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
}

module.exports = Coach;
