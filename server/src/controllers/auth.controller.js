const User = require('../models/User');
const redis = require('../config/redis');
const { generateToken, verifyToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');

exports.register = async (req, res) => {
  try {
    const { phone, code, nickname } = req.body;

    // 验证验证码
    const storedCode = await redis.get(`sms:${phone}`);
    if (!storedCode) {
      return errorResponse(res, 400, '验证码已过期，请重新发送');
    }
    if (storedCode !== code) {
      return errorResponse(res, 400, '验证码错误');
    }

    // 检查手机号是否已注册
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return errorResponse(res, 409, '该手机号已注册');
    }

    // 创建用户
    const userId = await User.create({ phone, nickname });

    // 删除已使用的验证码
    await redis.del(`sms:${phone}`);

    // 生成JWT
    const token = generateToken(userId, 'free');

    successResponse(res, { userId, token }, '注册成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, code } = req.body;

    // 验证验证码
    const storedCode = await redis.get(`sms:${phone}`);
    if (!storedCode) {
      return errorResponse(res, 400, '验证码已过期，请重新发送');
    }
    if (storedCode !== code) {
      return errorResponse(res, 400, '验证码错误');
    }

    // 查找用户
    const user = await User.findByPhone(phone);
    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    // 删除已使用的验证码
    await redis.del(`sms:${phone}`);

    // 生成JWT
    const token = generateToken(user.id, user.member_level);

    successResponse(res, { userId: user.id, token }, '登录成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.sendCode = async (req, res) => {
  try {
    const { phone } = req.body;

    // 检查发送频率（60秒内不可重复发送）
    const rateKey = `sms:rate:${phone}`;
    const rateLimit = await redis.get(rateKey);
    if (rateLimit) {
      return errorResponse(res, 429, '发送过于频繁，请稍后再试');
    }

    // 生成6位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 存储验证码到Redis，有效期5分钟
    await redis.set(`sms:${phone}`, code, 'EX', 300);

    // 设置发送频率限制，60秒
    await redis.set(rateKey, '1', 'EX', 60);

    // 模拟短信发送（开发环境直接返回验证码）
    console.log(`[短信模拟] 手机号: ${phone}, 验证码: ${code}`);

    const data = process.env.NODE_ENV === 'production' ? null : { code };
    successResponse(res, data, '验证码已发送');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.verifyRealName = async (req, res) => {
  try {
    const { realName, idCard } = req.body;
    const userId = req.user.id;

    // TODO: 调用第三方实名认证服务进行验证
    // 目前模拟认证通过
    const verified = true;

    if (!verified) {
      return errorResponse(res, 400, '实名认证失败，请检查信息是否正确');
    }

    // 更新用户实名认证状态
    await User.setRealNameVerified(userId);

    successResponse(res, null, '实名认证成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { token: oldToken } = req.body;

    if (!oldToken) {
      return errorResponse(res, 400, '缺少令牌');
    }

    // 验证旧token（即使过期也尝试解码）
    let decoded;
    try {
      decoded = verifyToken(oldToken);
    } catch (err) {
      if (err.name !== 'TokenExpiredError') {
        return errorResponse(res, 401, '无效的令牌');
      }
      // 对过期token，解码但不验证签名来获取userId
      decoded = verifyToken(oldToken, { ignoreExpiration: true });
    }

    // 查找用户确认存在
    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    // 生成新token
    const newToken = generateToken(user.id, user.member_level);

    successResponse(res, { token: newToken }, '令牌刷新成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

exports.logout = async (req, res) => {
  try {
    // 将当前token加入黑名单（可选，用于服务端强制失效）
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      // 将token存入Redis黑名单，过期时间与JWT过期时间一致
      const decoded = verifyToken(token);
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.set(`token:blacklist:${token}`, '1', 'EX', ttl);
      }
    }

    successResponse(res, null, '退出登录成功');
  } catch (err) {
    // 即使token无效也返回成功，保证客户端可以正常退出
    successResponse(res, null, '退出登录成功');
  }
};
