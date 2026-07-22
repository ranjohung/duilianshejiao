const { successResponse, errorResponse } = require('../utils/response');
const jwt = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const { query, run, get, setSmsCode, getSmsCode } = require('../utils/sqlite');

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

async function register(req, res) {
  try {
    const { phone, nickname, password } = req.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const result = await run(
      'INSERT INTO users (phone, nickname, password) VALUES (?, ?, ?)',
      [phone, nickname, hashedPassword]
    );

    await run(
      'INSERT INTO growth_profiles (user_id) VALUES (?)',
      [result.lastID]
    );

    const token = jwt.sign({ id: result.lastID, phone, nickname });

    successResponse(res, {
      token,
      user: { id: result.lastID, phone, nickname },
    }, '注册成功');
  } catch (error) {
    errorResponse(res, 500, '注册失败', error.message);
  }
}

async function login(req, res) {
  try {
    const { phone, code, password } = req.body;

    if (password) {
      const user = await get('SELECT * FROM users WHERE phone = ?', [phone]);
      if (!user) {
        return errorResponse(res, 400, '账号或密码错误');
      }
      if (!user.password) {
        return errorResponse(res, 400, '该账号未设置密码，请使用验证码登录');
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return errorResponse(res, 400, '账号或密码错误');
      }
      const token = jwt.sign({ id: user.id, phone, nickname: user.nickname });
      return successResponse(res, {
        token,
        user: { id: user.id, phone, nickname: user.nickname, points: user.total_points || 0, member_level: user.member_level || 'free', student_level: user.student_level || '青铜学员', is_real_name_verified: user.is_real_name_verified || 0 },
      }, '登录成功');
    }

    if (!/^\d{6}$/.test(code)) {
      return errorResponse(res, 400, '验证码错误');
    }

    let user = await get('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      const result = await run(
        'INSERT INTO users (phone, nickname) VALUES (?, ?)',
        [phone, '用户' + phone.slice(-4)]
      );
      await run('INSERT INTO growth_profiles (user_id) VALUES (?)', [result.lastID]);
      user = { id: result.lastID, phone, nickname: '用户' + phone.slice(-4) };
    }

    const token = jwt.sign({ id: user.id, phone, nickname: user.nickname });

    successResponse(res, {
      token,
      user: { id: user.id, phone, nickname: user.nickname, points: user.total_points || 0, member_level: user.member_level || 'free', student_level: user.student_level || '青铜学员', is_real_name_verified: user.is_real_name_verified || 0 },
    }, '登录成功');
  } catch (error) {
    errorResponse(res, 500, '登录失败', error.message);
  }
}

async function sendCode(req, res) {
  try {
    const { phone } = req.body;

    const code = generateCode();
    setSmsCode(phone, code);

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
