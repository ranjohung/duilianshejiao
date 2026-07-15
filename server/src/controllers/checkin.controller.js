const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const Item = require('../models/Item');
const { successResponse, errorResponse } = require('../utils/response');

// 学员等级定义
const STUDENT_LEVELS = [
  { name: 'bronze', label: '青铜', minPoints: 0 },
  { name: 'silver', label: '白银', minPoints: 100 },
  { name: 'gold', label: '黄金', minPoints: 300 },
  { name: 'platinum', label: '铂金', minPoints: 600 },
  { name: 'diamond', label: '钻石', minPoints: 1000 },
  { name: 'master', label: '大师', minPoints: 2000 },
];

function getStudentLevel(totalPoints) {
  let level = STUDENT_LEVELS[0];
  for (const l of STUDENT_LEVELS) {
    if (totalPoints >= l.minPoints) level = l;
  }
  return level;
}

// 签到
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已签到
    const existing = await CheckIn.findByUserAndDate(userId, today);
    if (existing) return errorResponse(res, 400, '今日已签到');

    // 获取连续签到天数
    const lastCheckIn = await CheckIn.findLatestByUser(userId);
    let streakDays = 1;
    if (lastCheckIn) {
      const lastDate = new Date(lastCheckIn.check_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) streakDays = (lastCheckIn.streak_days || 0) + 1;
    }

    // 计算签到奖励
    let pointsEarned = 5; // 基础5积分
    const itemsEarned = [];

    // 连续签到奖励
    if (streakDays >= 7) pointsEarned += 10;
    else if (streakDays >= 3) pointsEarned += 5;

    // 第3/5/7天获得时空穿梭券
    const cycleDay = streakDays % 7 === 0 ? 7 : streakDays % 7;
    if ([3, 5, 7].includes(cycleDay)) {
      await Item.grantItem(userId, 'time_shuttle', 1);
      itemsEarned.push('时空穿梭券×1');
    }

    // 创建签到记录
    await CheckIn.create({ userId, checkInDate: today, streakDays, pointsEarned });

    // 更新用户积分
    await User.addTrainingPoints(userId, pointsEarned);

    // 检查学员等级是否提升
    const user = await User.findById(userId);
    const newLevel = getStudentLevel(user.total_points);
    if (newLevel.name !== user.student_level) {
      await User.updateStudentLevel(userId, newLevel.name);
    }

    successResponse(res, {
      streakDays,
      pointsEarned,
      itemsEarned,
      totalPoints: user.total_points,
      studentLevel: newLevel.label,
    }, '签到成功');
  } catch (err) {
    errorResponse(res, 500, '签到失败');
  }
};

// 获取今日签到状态
exports.getToday = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = await CheckIn.findByUserAndDate(userId, today);
    const lastRecord = await CheckIn.findLatestByUser(userId);

    successResponse(res, {
      todayCheckedIn: !!todayRecord,
      streakDays: lastRecord?.streak_days || 0,
      todayPoints: todayRecord?.points_earned || 0,
    });
  } catch (err) {
    errorResponse(res, 500, '获取签到状态失败');
  }
};

// 获取签到日历
exports.getCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const records = await CheckIn.findByUserAndMonth(
      userId,
      parseInt(month) || new Date().getMonth() + 1,
      parseInt(year) || new Date().getFullYear()
    );
    successResponse(res, { records });
  } catch (err) {
    errorResponse(res, 500, '获取日历失败');
  }
};
