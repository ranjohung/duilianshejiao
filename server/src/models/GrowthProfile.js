const pool = require('../config/database');

class GrowthProfile {
  static async findByUser(userId) {
    const [rows] = await pool.execute('SELECT * FROM growth_profiles WHERE user_id = ?', [userId]);
    return rows[0] || null;
  }

  static async create(userId) {
    const [result] = await pool.execute(
      `INSERT INTO growth_profiles (user_id, social_confidence, expression_ability, emotional_intelligence, empathy_score, total_training_time, total_sessions)
       VALUES (?, 50, 50, 50, 50, 0, 0)`,
      [userId]
    );
    return result.insertId;
  }

  static async addDimensionScores(userId, deltaScores) {
    let profile = await this.findByUser(userId);
    if (!profile) {
      await this.create(userId);
      profile = await this.findByUser(userId);
    }

    const fields = [];
    const values = [];
    const dimensionKeys = ['social_confidence', 'expression_ability', 'emotional_intelligence', 'empathy_score', 'adaptability_score'];

    for (const key of dimensionKeys) {
      if (deltaScores[key]) {
        const current = profile[key] || 50;
        const updated = Math.min(100, Math.max(0, current + deltaScores[key]));
        fields.push(`${key} = ?`);
        values.push(updated);
      }
    }

    if (deltaScores.total_training_time) {
      fields.push('total_training_time = total_training_time + ?');
      values.push(deltaScores.total_training_time);
    }
    if (deltaScores.total_sessions) {
      fields.push('total_sessions = total_sessions + ?');
      values.push(deltaScores.total_sessions);
    }

    if (fields.length === 0) return profile;

    values.push(userId);
    await pool.execute(
      `UPDATE growth_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    return this.findByUser(userId);
  }
}

module.exports = GrowthProfile;
