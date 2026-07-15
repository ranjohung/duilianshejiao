const pool = require('../config/database');

const TABLE = 'goodnight_plans';

module.exports = {
  TABLE,

  async findByUser(userId) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  },

  async createOrUpdate({ userId, coachId, pushTime, enabled }) {
    const existing = await this.findByUser(userId);
    if (existing) {
      const fields = [];
      const values = [];
      if (coachId !== undefined) { fields.push('coach_id = ?'); values.push(coachId); }
      if (pushTime !== undefined) { fields.push('push_time = ?'); values.push(pushTime); }
      if (enabled !== undefined) { fields.push('enabled = ?'); values.push(enabled ? 1 : 0); }
      if (fields.length === 0) return;
      fields.push('updated_at = NOW()');
      values.push(userId);
      await pool.execute(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE user_id = ?`, values);
    } else {
      await pool.execute(
        `INSERT INTO ${TABLE} (user_id, coach_id, push_time, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [userId, coachId, pushTime, enabled ? 1 : 0]
      );
    }
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, coach_id, push_time, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [data.userId, data.coachId, data.pushTime, data.enabled ? 1 : 0]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
    fields.push('updated_at = NOW()');
    values.push(id);
    await pool.execute(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
  },
};
