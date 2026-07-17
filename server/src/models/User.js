const pool = require('../config/database');

const LEVELS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'];
const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800];

class User {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByPhone(phone) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0];
  }

  static async create(userData) {
    const { phone, password, nickname, avatar } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (phone, password, nickname, avatar, points, level) VALUES (?, ?, ?, ?, ?, ?)',
      [phone, password, nickname || '用户', avatar || '', 0, 'bronze']
    );
    return result.insertId;
  }

  static async updatePoints(userId, delta) {
    const [result] = await pool.execute(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [delta, userId]
    );

    const [userRows] = await pool.execute('SELECT points FROM users WHERE id = ?', [userId]);
    const newPoints = userRows[0]?.points || 0;

    await this._updateLevel(userId, newPoints);

    return { success: result.affectedRows > 0, newPoints };
  }

  static async _updateLevel(userId, points) {
    let newLevel = 'bronze';
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= LEVEL_THRESHOLDS[i]) {
        newLevel = LEVELS[i];
        break;
      }
    }

    await pool.execute(
      'UPDATE users SET level = ? WHERE id = ?',
      [newLevel, userId]
    );

    return newLevel;
  }

  static async getUserStats(userId) {
    const [rows] = await pool.execute(
      'SELECT points, level, experience, streak, total_trainings FROM users WHERE id = ?',
      [userId]
    );
    return rows[0];
  }

  static async incrementExperience(userId, amount) {
    await pool.execute(
      'UPDATE users SET experience = experience + ? WHERE id = ?',
      [amount, userId]
    );
  }

  static async incrementStreak(userId) {
    await pool.execute(
      'UPDATE users SET streak = streak + 1, last_checkin = NOW() WHERE id = ?',
      [userId]
    );
  }

  static async resetStreak(userId) {
    await pool.execute(
      'UPDATE users SET streak = 0 WHERE id = ?',
      [userId]
    );
  }

  static async incrementTotalTrainings(userId) {
    await pool.execute(
      'UPDATE users SET total_trainings = total_trainings + 1 WHERE id = ?',
      [userId]
    );
  }

  static async updateProfile(userId, profileData) {
    const { nickname, avatar, gender, birthday, signature } = profileData;
    const updateFields = [];
    const values = [];

    if (nickname !== undefined) { updateFields.push('nickname = ?'); values.push(nickname); }
    if (avatar !== undefined) { updateFields.push('avatar = ?'); values.push(avatar); }
    if (gender !== undefined) { updateFields.push('gender = ?'); values.push(gender); }
    if (birthday !== undefined) { updateFields.push('birthday = ?'); values.push(birthday); }
    if (signature !== undefined) { updateFields.push('signature = ?'); values.push(signature); }

    if (updateFields.length === 0) return { success: false };

    values.push(userId);

    const [result] = await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    return { success: result.affectedRows > 0 };
  }

  static async getLevelInfo(points) {
    let currentLevel = 'bronze';
    let nextLevel = null;
    let progress = 0;

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= LEVEL_THRESHOLDS[i]) {
        currentLevel = LEVELS[i];
        if (i < LEVEL_THRESHOLDS.length - 1) {
          nextLevel = LEVELS[i + 1];
          const currentThreshold = LEVEL_THRESHOLDS[i];
          const nextThreshold = LEVEL_THRESHOLDS[i + 1];
          progress = Math.min(100, ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
        }
        break;
      }
    }

    return {
      level: currentLevel,
      levelName: _getLevelName(currentLevel),
      nextLevel: nextLevel,
      nextLevelName: nextLevel ? _getLevelName(nextLevel) : null,
      progress: Math.round(progress),
      points,
    };
  }
}

function _getLevelName(level) {
  const names = {
    'bronze': '青铜学员',
    'silver': '白银学员',
    'gold': '黄金学员',
    'platinum': '铂金学员',
    'diamond': '钻石学员',
    'master': '社交大师',
  };
  return names[level] || level;
}

module.exports = User;
