const pool = require('../config/database');

class CheckIn {
  static async findByUserAndDate(userId, date) {
    const [rows] = await pool.execute(
      'SELECT * FROM check_ins WHERE user_id = ? AND check_date = ?',
      [userId, date]
    );
    return rows[0] || null;
  }

  static async findLatestByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM check_ins WHERE user_id = ? ORDER BY check_date DESC LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  }

  static async findByUserAndMonth(userId, month, year) {
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;
    const [rows] = await pool.execute(
      `SELECT * FROM check_ins WHERE user_id = ? AND YEAR(check_date) = ? AND MONTH(check_date) = ? ORDER BY check_date`,
      [userId, y, m]
    );
    return rows;
  }

  static async create({ userId, checkInDate, streakDays, pointsEarned }) {
    const [result] = await pool.execute(
      `INSERT INTO check_ins (user_id, check_date, streak_days, points_earned) VALUES (?, ?, ?, ?)`,
      [userId, checkInDate, streakDays, pointsEarned]
    );
    return result.insertId;
  }
}

module.exports = CheckIn;
