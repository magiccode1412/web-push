import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import { createModuleLogger } from './utils/logger.js';
import { httpLogger, errorLogger, attachLogger } from './middleware/logger.js';
import authRoutes from './routes/auth.js';
import pushRoutes from './routes/push.js';
import recordRoutes from './routes/records.js';
import subscribeRoutes from './routes/subscribe.js';
import vapidRoutes from './routes/vapid.js';

dotenv.config();

// 创建主服务器 logger
const logger = createModuleLogger('Server');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use(attachLogger);
app.use(httpLogger);

// 静态文件服务（前端）
app.use(express.static('../dist'));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/vapid-key', vapidRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 前端路由回退（SPA fallback - 必须放在所有 API 路由之后）
// 所有非 API 请求都返回 index.html，由前端路由处理
app.get('*', (req, res, next) => {
  // 只对非 API 请求返回 index.html
  if (!req.path.startsWith('/api')) {
    res.sendFile('dist/index.html', { root: '..' });
  } else {
    next();
  }
});

// API 404 处理（只处理 /api 开头的请求）
app.use('/api', (req, res) => {
  logger.warn('【404错误】API路由不存在', {
    请求方法: req.method,
    请求路径: req.url,
    完整URL: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    客户端IP: req.ip || req.connection.remoteAddress,
    UserAgent: req.get('user-agent')?.substring(0, 50) + '...' || 'Unknown'
  });
  res.status(404).json({ error: 'Not Found' });
});

// 错误处理
app.use(errorLogger);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 启动服务器
async function startServer() {
  try {
    logger.info('【服务器启动】开始启动服务器', {
      端口: PORT,
      环境: process.env.NODE_ENV || 'development',
      时间: new Date().toISOString()
    });

    // 初始化数据库
    logger.info('【数据库初始化】开始初始化数据库...');
    await initDatabase();
    logger.info('【数据库初始化完成】数据库已就绪');

    app.listen(PORT, () => {
      logger.info('【服务器启动完成】服务器已启动', {
        监听地址: `http://localhost:${PORT}`,
        环境: process.env.NODE_ENV || 'development',
        时间: new Date().toISOString()
      });
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal) => {
      logger.info(`【服务器关闭】收到 ${signal} 信号, 开始关闭...`, {
        时间: new Date().toISOString()
      });
      logger.info('【服务器关闭完成】服务器已安全关闭');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('【未捕获异常】程序遇到未处理的异常', {
        错误信息: error.message,
        堆栈: error.stack,
        时间: new Date().toISOString()
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('【未处理Promise】Promise 拒绝未被处理', {
        原因: String(reason),
        时间: new Date().toISOString()
      });
    });

  } catch (error) {
    logger.error('【启动失败】服务器启动失败', {
      错误: error.message,
      堆栈: error.stack,
      时间: new Date().toISOString()
    });
    process.exit(1);
  }
}

startServer();
