const rateLimit = require('express-rate-limit');

// 通用限制：每分钟60次
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

// LLM对话：每分钟10次
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

// 短信发送：每小时5次
const smsLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

module.exports = { generalLimiter, chatLimiter, smsLimiter };
