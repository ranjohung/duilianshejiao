const CheckIn = require('../models/CheckIn');
const { successResponse, errorResponse } = require('../utils/response');

// 业务日按产品时区计算，避免服务器使用 UTC 时在北京时间 00:00~07:59 错算签到日期。
function getBusinessDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.BUSINESS_TIMEZONE || 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

// 学员等级定义
const STUDENT_LEVELS = [
  { name: 'bronze', label: '青铜', minPoints: 0 },
  { name: 'silver', label: '白银', minPoints: 100 },
  { name: 'gold', label: '黄金', minPoints: 200 },
  { name: 'platinum', label: '铂金', minPoints: 400 },
  { name: 'diamond', label: '钻石', minPoints: 600 },
  { name: 'master', label: '大师', minPoints: 800 },
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
    const today = getBusinessDate();
    const result = await CheckIn.settleAtomic({
      userId,
      checkInDate: today,
      pointsEarned: 10,
      ticketReward: 1, // 第7天会在事务内按连续天数改为4，否则为1。
      ticketLimit: 10,
    });
    if (!result.success) {
      if (result.reason === 'already_checked_in') return errorResponse(res, 400, '今日已签到');
      return errorResponse(res, 404, '用户不存在');
    }

    // 与 Web/PRD 统一：每日固定10积分+1张券，第7天额外3张券。
    // totalPoints 是可消费余额（兼容旧接口字段）；lifetimePoints 才用于等级。
    successResponse(res, {
      streakDays: result.streakDays,
      pointsEarned: result.pointsEarned,
      itemsEarned: [`时空穿梭券×${result.ticketsEarned}`],
      totalPoints: result.newPoints,
      lifetimePoints: result.totalPoints,
      studentLevel: getStudentLevel(result.totalPoints).label,
    }, '签到成功');
  } catch (err) {
    errorResponse(res, 500, '签到失败');
  }
};

// 获取今日签到状态
exports.getToday = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getBusinessDate();
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
