const redis = require('../config/redis');

/**
 * 防沉迷检查中间件
 * 规则：
 * - 连续30分钟：提醒
 * - 连续1小时：提醒
 * - 连续1.5小时：提醒建议休息15分钟
 * - 连续2小时：强制锁定15分钟
 * - 未成年人每日上限1小时
 * - 成年人每日上限4小时
 */
const antiAddictionCheck = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = Date.now();

    // 从Redis获取训练时长
    const sessionKey = `anti_addiction:${userId}`;
    const session = await redis.get(sessionKey);
    const data = session
      ? JSON.parse(session)
      : { startTime: now, totalMinutes: 0, lockedUntil: 0, dateKey: new Date().toDateString() };

    // 日期重置（跨天）
    const todayKey = new Date().toDateString();
    if (data.dateKey !== todayKey) {
      data.dateKey = todayKey;
      data.totalMinutes = 0;
      data.startTime = now;
      data.lockedUntil = 0;
    }

    // 检查是否在锁定期间
    if (data.lockedUntil && now < data.lockedUntil) {
      const remainingMinutes = Math.ceil((data.lockedUntil - now) / 60000);
      return res.status(429).json({
        code: 429,
        message: `训练时间已到，休息一下吧，${remainingMinutes}分钟后可以继续`,
        data: { locked: true, remainingMinutes },
      });
    }

    // 计算连续训练时长
    const continuousMinutes = Math.floor((now - data.startTime) / 60000);

    // 检查各级别提醒
    if (continuousMinutes >= 120) {
      // 强制锁定15分钟
      data.lockedUntil = now + 15 * 60 * 1000;
      await redis.set(sessionKey, JSON.stringify(data), 'EX', 86400);
      return res.status(429).json({
        code: 429,
        message: '已连续训练2小时，强制休息15分钟',
        data: { locked: true, remainingMinutes: 15 },
      });
    }

    // 未成年人每日上限检查
    const user = req.user;
    if (user.age && user.age < 18 && data.totalMinutes >= 60) {
      return res.status(429).json({
        code: 429,
        message: '未成年人每日训练时长已达上限（1小时）',
        data: { locked: true, remainingMinutes: 0, dailyLimit: true },
      });
    }

    // 成年人每日上限检查
    if (!user.age || user.age >= 18) {
      if (data.totalMinutes >= 240) {
        return res.status(429).json({
          code: 429,
          message: '今日训练时长已达上限（4小时）',
          data: { locked: true, remainingMinutes: 0, dailyLimit: true },
        });
      }
    }

    // 附加提醒信息（不阻断）
    let warning = null;
    if (continuousMinutes >= 90) warning = '已训练1.5小时，建议休息15分钟';
    else if (continuousMinutes >= 60) warning = '已训练1小时，建议起身活动';
    else if (continuousMinutes >= 30) warning = '已训练30分钟，休息一下吧';

    req.antiAddictionWarning = warning;
    next();
  } catch (err) {
    // 防沉迷检查失败不阻断请求
    next();
  }
};

/**
 * 更新训练时长（训练结束时调用）
 */
const updateTrainingTime = async (userId, durationMinutes) => {
  try {
    const sessionKey = `anti_addiction:${userId}`;
    const session = await redis.get(sessionKey);
    const data = session
      ? JSON.parse(session)
      : { startTime: Date.now(), totalMinutes: 0, lockedUntil: 0, dateKey: new Date().toDateString() };

    data.totalMinutes += durationMinutes;
    await redis.set(sessionKey, JSON.stringify(data), 'EX', 86400);
  } catch (err) {
    // 静默失败
  }
};

module.exports = { antiAddictionCheck, updateTrainingTime };
