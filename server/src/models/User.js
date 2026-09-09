const pool = require('../config/database');

// 与 Web/PRD 的累计进度等级保持一致：total_points 为累计进度，training_points 为可消费余额。
const LEVELS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'];
const LEVEL_THRESHOLDS = [0, 100, 200, 400, 600, 800];

class User {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByPhone(phone) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0];
  }

  static async hasActiveMembership(userId) {
    const [rows] = await pool.execute(
      `SELECT EXISTS(
         SELECT 1 FROM memberships m
          JOIN users u ON u.id = m.user_id
         WHERE m.user_id = ? AND m.level = u.member_level
           AND m.is_active = 1 AND m.end_date >= CURRENT_DATE
       ) AS active`,
      [userId]
    );
    return Number(rows[0]?.active) === 1;
  }

  static async create(userData) {
    const { phone, password, nickname, avatar } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (phone, password, nickname, avatar, training_points, total_points, student_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [phone, password, nickname || '用户', avatar || '', 0, 0, 'bronze']
    );
    return result.insertId;
  }

  static async updatePoints(userId, delta) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await this.updatePointsInTransaction(connection, userId, delta);
      await connection.commit();
      await this._updateLevel(userId, result.totalPoints);
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 在已有业务事务中更新积分，供签到等“记录+奖励”必须同成功/同回滚的流程复用。
  // 调用方负责 begin/commit/rollback；正向积分同时增加累计进度和可用余额，消费只扣可用余额。
  static async updatePointsInTransaction(connection, userId, delta) {
    const numericDelta = Number(delta);
    const requested = Number.isFinite(numericDelta) ? Math.trunc(numericDelta) : 0;
    const [rows] = await connection.execute(
      `SELECT u.training_points, u.total_points, u.member_level,
              EXISTS(
                SELECT 1 FROM memberships m
                 WHERE m.user_id = u.id AND m.level = u.member_level
                   AND m.is_active = 1 AND m.end_date >= CURRENT_DATE
              ) AS membership_active
         FROM users u WHERE u.id = ? FOR UPDATE`,
      [userId]
    );
    if (rows.length === 0) {
      return { success: false, newPoints: 0, totalPoints: 0, appliedDelta: 0 };
    }

    const current = rows[0];
    const balance = Number(current.training_points) || 0;
    const lifetime = Number(current.total_points) || 0;
    let appliedDelta = 0;
    let operationSuccess = true;
    if (requested > 0) {
      const paid = ['daily', 'weekly', 'monthly', 'yearly'].includes(current.member_level)
        && Number(current.membership_active) === 1;
      const cap = paid ? Infinity : 2000;
      appliedDelta = Math.min(requested, Math.max(0, cap - lifetime));
      if (appliedDelta > 0) {
        await connection.execute(
          'UPDATE users SET total_points = total_points + ?, training_points = training_points + ? WHERE id = ?',
          [appliedDelta, appliedDelta, userId]
        );
      }
    } else if (requested < 0) {
      const requestedSpend = Math.abs(requested);
      // 消费必须原子成功或完全失败，不能把余额不足的请求截断后继续创建权益。
      if (balance < requestedSpend) {
        operationSuccess = false;
      } else if (requestedSpend > 0) {
        appliedDelta = -requestedSpend;
        await connection.execute(
          'UPDATE users SET training_points = training_points - ? WHERE id = ?',
          [requestedSpend, userId]
        );
      }
    }

    const [updatedRows] = await connection.execute(
      'SELECT training_points, total_points FROM users WHERE id = ?',
      [userId]
    );
    return {
      success: operationSuccess,
      newPoints: Number(updatedRows[0]?.training_points) || 0,
      totalPoints: Number(updatedRows[0]?.total_points) || 0,
      appliedDelta,
    };

  }

  static async _updateLevel(userId, points) {
    // 重新依据数据库当前累计值计算，避免并发奖励在提交顺序交错时把等级回写低。
    const [rows] = await pool.execute('SELECT total_points FROM users WHERE id = ?', [userId]);
    const currentPoints = Number(rows[0]?.total_points);
    const effectivePoints = Number.isFinite(currentPoints) ? currentPoints : Number(points) || 0;
    let newLevel = 'bronze';
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (effectivePoints >= LEVEL_THRESHOLDS[i]) {
        newLevel = LEVELS[i];
        break;
      }
    }

    await pool.execute('UPDATE users SET student_level = ? WHERE id = ?', [newLevel, userId]);
    return newLevel;
  }

  static async getUserStats(userId) {
    const [rows] = await pool.execute(
      `SELECT u.training_points AS points,
              u.total_points AS totalPoints,
              u.student_level AS level,
              0 AS experience,
              u.streak_days AS streak,
              COALESCE(g.total_sessions, 0) AS total_trainings
         FROM users u
         LEFT JOIN growth_profiles g ON g.user_id = u.id
        WHERE u.id = ?`,
      [userId]
    );
    return rows[0];
  }

  static async incrementExperience(userId, amount) {
    // 旧 API 的 experience 已被累计进度积分取代，统一走积分账本避免写入不存在的字段。
    return this.updatePoints(userId, amount);
  }

  static async incrementStreak(userId) {
    await pool.execute(
      'UPDATE users SET streak_days = streak_days + 1 WHERE id = ?',
      [userId]
    );
  }

  static async resetStreak(userId) {
    await pool.execute(
      'UPDATE users SET streak_days = 0 WHERE id = ?',
      [userId]
    );
  }

  static async incrementTotalTrainings(userId) {
    await pool.execute(
      `INSERT INTO growth_profiles (user_id, total_sessions, updated_at)
       VALUES (?, 1, NOW())
       ON DUPLICATE KEY UPDATE total_sessions = total_sessions + 1, updated_at = NOW()`,
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

// 兼容旧控制器的只读/事务查询调用；新代码优先直接依赖 User 方法。
User.pool = pool;

function _getLevelName(level) {
  const names = {
    'bronze': '青铜学员',
    'silver': '白银学员',
    'gold': '黄金学员',
    'platinum': '铂金学员',
    'diamond': '钻石学员',
    'master': '大师学员',
  };
  return names[level] || level;
}

module.exports = User;
