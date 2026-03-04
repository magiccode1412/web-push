import { logRequest, createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('HTTP');

/**
 * HTTP 请求日志中间件
 * 记录所有 HTTP 请求的详细信息
 */
export const httpLogger = (req, res, next) => {
  const startTime = Date.now();

  // 监听响应完成事件
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    // 跳过健康检查端点的日志
    if (req.path === '/health') {
      return;
    }

    // 跳过静态文件请求
    if (req.path.startsWith('/dist/') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      return;
    }

    logRequest(req, res, responseTime);
  });

  next();
};

/**
 * 错误日志中间件
 * 记录所有未处理的错误
 */
export const errorLogger = (err, req, res, next) => {
  const errorDetails = {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode || 500,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    stack: err.stack,
  };

  // 根据状态码选择日志级别
  if (err.statusCode >= 500) {
    logger.error('【服务器错误】请求处理出错', {
      错误类型: err.name,
      错误信息: err.message,
      请求方法: req.method,
      请求路径: req.url,
      客户端IP: req.ip || req.connection.remoteAddress,
      堆栈: err.stack
    });
  } else if (err.statusCode >= 400) {
    logger.warn('【客户端错误】请求参数错误', {
      错误信息: err.message,
      请求方法: req.method,
      请求路径: req.url,
      客户端IP: req.ip || req.connection.remoteAddress
    });
  } else {
    logger.error('【未处理错误】', {
      错误信息: err.message,
      请求方法: req.method,
      请求路径: req.url,
      客户端IP: req.ip || req.connection.remoteAddress,
      堆栈: err.stack
    });
  }

  next(err);
};

/**
 * 为每个请求附加 logger 实例
 */
export const attachLogger = (req, res, next) => {
  req.logger = createModuleLogger('HTTP');
  next();
};

export default {
  httpLogger,
  errorLogger,
  attachLogger,
};
