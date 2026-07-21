if (!process.env.VERCEL) {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// 错误处理
app.use(errorHandler);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`「对练社交」后端服务启动 - 端口: ${PORT}`);
  });
}

module.exports = app;
