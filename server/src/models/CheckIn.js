const pool = require('../config/database');

const TABLE = 'check_ins';

module.exports = {
  TABLE,
  async findByUserIdAndDate(userId, date) {
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? AND check_date = ?`,
      [userId, date]
    );
    return rows[0] || null;
  },
  async findByUserIdAndMonth(userId, yearMonth) {
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? AND DATE_FORMAT(check_date, '%Y-%m') = ?`,
      [userId, yearMonth]
    );
    return rows;
  },
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, check_date, streak_days) VALUES (?, ?, ?)`,
      [data.userId, data.checkDate, data.streakDays || 1]
    );
    return result.insertId;
  },
};
