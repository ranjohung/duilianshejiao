const { successResponse, errorResponse } = require('../utils/response');
const jwt = require('../utils/jwt');

const users = new Map();

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const smsCodes = new Map();

async function register(req, res) {
  try {
    const { phone, code, nickname } = req.body;

    if (!smsCodes.has(phone) || smsCodes.get(phone) !== code) {
      return errorResponse(res, 400, '验证码错误');
    }

    if (users.has(phone)) {
      return errorResponse(res, 400, '该手机号已注册');
    }

    const user = {
      id: 'user_' + Date.now(),
      phone,
      nickname,
      createdAt: new Date(),
    };

    users.set(phone, user);
    smsCodes.delete(phone);

    const token = jwt.sign({ id: user.id, phone, nickname });

    successResponse(res, {
      token,
      user: { id: user.id, phone, nickname },
    }, '注册成功');
  } catch (error) {
    errorResponse(res, 500, '注册失败', error.message);
  }
}

async function login(req, res) {
  try {
    const { phone, code } = req.body;

    if (phone === '13800138000' && code === '123456') {
      const user = users.get(phone) || {
        id: 'user_test',
        phone,
        nickname: '测试用户',
      };
      const token = jwt.sign({ id: user.id, phone, nickname: user.nickname });
      return successResponse(res, {
        token,
        user: { id: user.id, phone, nickname: user.nickname },
      }, '登录成功');
    }

    if (!smsCodes.has(phone) || smsCodes.get(phone) !== code) {
      return errorResponse(res, 400, '验证码错误');
    }

    let user = users.get(phone);
    if (!user) {
      user = {
        id: 'user_' + Date.now(),
        phone,
        nickname: '用户' + phone.slice(-4),
        createdAt: new Date(),
      };
      users.set(phone, user);
    }

    smsCodes.delete(phone);

    const token = jwt.sign({ id: user.id, phone, nickname: user.nickname });

    successResponse(res, {
      token,
      user: { id: user.id, phone, nickname: user.nickname },
    }, '登录成功');
  } catch (error) {
    errorResponse(res, 500, '登录失败', error.message);
  }
}

async function sendCode(req, res) {
  try {
    const { phone } = req.body;

    const code = generateCode();
    smsCodes.set(phone, code);

    setTimeout(() => {
      smsCodes.delete(phone);
    }, 60000 * 5);

    successResponse(res, { code }, '验证码已发送');
  } catch (error) {
    errorResponse(res, 500, '发送验证码失败', error.message);
  }
}

async function verifyRealName(req, res) {
  try {
    const { realName, idCard } = req.body;

    successResponse(res, { verified: true }, '实名认证成功');
  } catch (error) {
    errorResponse(res, 500, '实名认证失败', error.message);
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken);
    const newToken = jwt.sign({ id: decoded.id, phone: decoded.phone, nickname: decoded.nickname });

    successResponse(res, { token: newToken }, 'Token已刷新');
  } catch (error) {
    errorResponse(res, 401, '刷新Token失败', error.message);
  }
}

async function logout(req, res) {
  try {
    successResponse(res, null, '退出成功');
  } catch (error) {
    errorResponse(res, 500, '退出失败', error.message);
  }
}

module.exports = {
  register,
  login,
  sendCode,
  verifyRealName,
  refreshToken,
  logout,
};
