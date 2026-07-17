const rateLimit = (limit, windowMs) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'];
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    userRequests.push(now);
    
    const recentRequests = userRequests.filter(t => t > windowStart);
    
    if (recentRequests.length > limit) {
      return res.status(429).json({ 
        code: 429, 
        message: '请求过于频繁，请稍后重试', 
        data: null 
      });
    }
    
    requests.set(key, recentRequests);
    next();
  };
};

const smsLimiter = rateLimit(5, 60000);
const chatLimiter = rateLimit(30, 60000);

module.exports = { smsLimiter, chatLimiter };