const pool = require('../config/database');

const TABLE = 'growth_profiles';

module.exports = {
  TABLE,
  async findByUserId(userId) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  },
  async upsert(userId, data) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      const fields = [];
      const values = [];
      for (const [key, value] of Object.entries(data)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
      values.push(userId);
      await pool.execute(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE user_id = ?`, values);
    } else {
      const keys = ['user_id', ...Object.keys(data)];
      const vals = [userId, ...Object.values(data)];
      await pool.execute(
        `INSERT INTO ${TABLE} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
        vals
      );
    }
  },
};
