const pool = require('../config/database');
const User = require('./User');
const Item = require('./Item');

function toBusinessDayNumber(value) {
  const text = String(value || '').slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / (1000 * 60 * 60 * 24);
}

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

  // 签到记录、积分和穿梭券必须在同一个数据库事务中结算。
  // 先锁定用户并用唯一键抢占当天记录，跨进程并发时重复请求会整体回滚且不重复发奖。
  static async settleAtomic({ userId, checkInDate, pointsEarned = 10, ticketReward = 1, ticketLimit = 10 }) {
    const connection = await pool.getConnection();
    let checkInInsertAttempted = false;
    try {
      await connection.beginTransaction();

      const [userRows] = await connection.execute(
        `SELECT u.id, u.member_level,
                EXISTS(
                  SELECT 1 FROM memberships m
                   WHERE m.user_id = u.id AND m.level = u.member_level
                     AND m.is_active = 1 AND m.end_date >= CURRENT_DATE
                ) AS membership_active
           FROM users u WHERE u.id = ? FOR UPDATE`,
        [userId]
      );
      if (userRows.length === 0) {
        await connection.rollback();
        return { success: false, reason: 'user_not_found' };
      }

      const [existingRows] = await connection.execute(
        'SELECT id FROM check_ins WHERE user_id = ? AND check_date = ? FOR UPDATE',
        [userId, checkInDate]
      );
      if (existingRows.length > 0) {
        await connection.rollback();
        return { success: false, reason: 'already_checked_in' };
      }

      const [lastRows] = await connection.execute(
        'SELECT check_date, streak_days FROM check_ins WHERE user_id = ? ORDER BY check_date DESC LIMIT 1 FOR UPDATE',
        [userId]
      );
      let streakDays = 1;
      const lastDay = toBusinessDayNumber(lastRows[0]?.check_date);
      const todayDay = toBusinessDayNumber(checkInDate);
      if (Number.isFinite(lastDay) && Number.isFinite(todayDay) && todayDay - lastDay === 1) {
        streakDays = (Number(lastRows[0]?.streak_days) || 0) + 1;
      }

      const effectiveTicketLimit = Number(userRows[0].membership_active) === 1 ? 20 : Math.max(0, Number(ticketLimit) || 10);
      const effectiveTicketReward = streakDays % 7 === 0 ? 4 : Math.max(0, Number(ticketReward) || 1);
      const itemDbId = await Item.resolveItemIdInTransaction(connection, 'time_shuttle');
      if (!itemDbId) throw new Error('道具不存在：time_shuttle');
      const [itemRows] = await connection.execute(
        'SELECT quantity FROM user_items WHERE user_id = ? AND item_id = ? FOR UPDATE',
        [userId, itemDbId]
      );
      const beforeTickets = Number(itemRows[0]?.quantity) || 0;
      const grantCount = Math.max(0, Math.min(effectiveTicketReward, effectiveTicketLimit - beforeTickets));
      if (grantCount > 0) {
        await Item.addItemToUserInTransaction(connection, userId, 'time_shuttle', grantCount);
      }

      const pointResult = await User.updatePointsInTransaction(connection, userId, pointsEarned);
      const actualPointsEarned = Math.max(0, Number(pointResult.appliedDelta) || 0);
      checkInInsertAttempted = true;
      await connection.execute(
        'INSERT INTO check_ins (user_id, check_date, streak_days, points_earned) VALUES (?, ?, ?, ?)',
        [userId, checkInDate, streakDays, actualPointsEarned]
      );

      const lifetimePoints = Number(pointResult.totalPoints) || 0;
      const studentLevel = lifetimePoints >= 800 ? 'master'
        : lifetimePoints >= 600 ? 'diamond'
          : lifetimePoints >= 400 ? 'platinum'
            : lifetimePoints >= 200 ? 'gold'
              : lifetimePoints >= 100 ? 'silver' : 'bronze';
      await connection.execute('UPDATE users SET student_level = ? WHERE id = ?', [studentLevel, userId]);
      await connection.commit();

      return {
        success: true,
        streakDays,
        pointsEarned: actualPointsEarned,
        ticketsEarned: grantCount,
        newPoints: Number(pointResult.newPoints) || 0,
        totalPoints: lifetimePoints,
        studentLevel,
      };
    } catch (error) {
      await connection.rollback();
      // 唯一键是跨实例并发的最终裁判；重复请求不应向用户显示 500。
      if (checkInInsertAttempted && error?.code === 'ER_DUP_ENTRY') {
        return { success: false, reason: 'already_checked_in' };
      }
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = CheckIn;
