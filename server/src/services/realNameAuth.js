/**
 * 实名认证服务
 * 优先级：uni一键登录 > 阿里云实人认证 > uni实人认证
 * 系统自动识别优先用便宜的
 */
const AUTH_PROVIDERS = [
  { name: 'uni_quick_login', label: 'uni一键登录', cost: 0.025, priority: 1 },
  { name: 'aliyun_real_person', label: '阿里云实人认证', cost: 1.0, priority: 2 },
  { name: 'uni_real_person', label: 'uni实人认证', cost: 0.85, priority: 3 },
];

/**
 * 获取最优认证渠道（按优先级排序）
 * @returns {Array} 排序后的认证渠道列表
 */
function getOptimalProvider() {
  return [...AUTH_PROVIDERS].sort((a, b) => a.priority - b.priority);
}

/**
 * 实名认证
 * @param {Object} params
 * @param {string} params.provider - 认证渠道名称
 * @param {string} params.realName - 真实姓名
 * @param {string} params.idCard - 身份证号
 * @param {string} params.accessToken - 认证token
 * @returns {Promise<{ verified: boolean, provider: string }>}
 */
async function verifyRealName({ provider, realName, idCard, accessToken }) {
  const providerConfig = AUTH_PROVIDERS.find(p => p.name === provider);
  if (!providerConfig) {
    return { verified: false, provider, error: '不支持的认证渠道' };
  }

  // TODO: 根据provider调用对应认证接口
  // uni_quick_login: 调用uni一键登录API
  // aliyun_real_person: 调用阿里云实人认证API
  // uni_real_person: 调用uni实人认证API

  switch (provider) {
    case 'uni_quick_login':
      // uni一键登录：通过运营商网关获取手机号，确认实名
      // 实际调用: uniCloud.callFunction({ name: 'getPhoneNumber', data: { accessToken } })
      return { verified: true, provider: providerConfig.name };

    case 'aliyun_real_person':
      // 阿里云实人认证：姓名+身份证号+人脸比对
      // 实际调用: aliyun SDK
      return { verified: true, provider: providerConfig.name };

    case 'uni_real_person':
      // uni实人认证：uniCloud实人认证插件
      // 实际调用: uniCloud.callFunction({ name: 'realPersonAuth', data: { accessToken } })
      return { verified: true, provider: providerConfig.name };

    default:
      return { verified: false, provider, error: '未知认证渠道' };
  }
}

module.exports = { AUTH_PROVIDERS, getOptimalProvider, verifyRealName };
