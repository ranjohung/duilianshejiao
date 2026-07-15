const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByPhone(phone) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0] || null;
  }

  static async create({ phone, nickname, password, avatar, gender, age, memberLevel = 'free' }) {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const [result] = await pool.execute(
      `INSERT INTO users (phone, nickname, password, avatar, gender, age, member_level, training_points, total_points, student_level, weekly_trainings_used, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'bronze', 0, NOW(), NOW())`,
      [phone, nickname, hashedPassword, avatar || '', gender || 'other', age || null, memberLevel]
    );
    return result.insertId;
  }

  static async updateProfile(id, { nickname, avatar, gender, age }) {
    const fields = [];
    const values = [];
    if (nickname) { fields.push('nickname = ?'); values.push(nickname); }
    if (avatar) { fields.push('avatar = ?'); values.push(avatar); }
    if (gender) { fields.push('gender = ?'); values.push(gender); }
    if (age) { fields.push('age = ?'); values.push(age); }
    if (fields.length === 0) return;
    fields.push('updated_at = NOW()');
    values.push(id);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async updateMemberLevel(id, memberLevel) {
    await pool.execute('UPDATE users SET member_level = ?, updated_at = NOW() WHERE id = ?', [memberLevel, id]);
  }

  static async addTrainingPoints(id, points) {
    await pool.execute(
      'UPDATE users SET training_points = training_points + ?, total_points = total_points + ?, updated_at = NOW() WHERE id = ?',
      [points, points, id]
    );
  }

  static async consumeTrainingPoints(id, points) {
    const [rows] = await pool.execute('SELECT training_points FROM users WHERE id = ?', [id]);
    if (!rows[0] || rows[0].training_points < points) return false;
    await pool.execute('UPDATE users SET training_points = training_points - ?, updated_at = NOW() WHERE id = ?', [points, id]);
    return true;
  }

  static async updateStudentLevel(id, studentLevel) {
    await pool.execute('UPDATE users SET student_level = ?, updated_at = NOW() WHERE id = ?', [studentLevel, id]);
  }

  static async verifyPassword(user, password) {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  static async setRealNameVerified(id) {
    await pool.execute('UPDATE users SET is_real_name_verified = 1, updated_at = NOW() WHERE id = ?', [id]);
  }
}

module.exports = User;
