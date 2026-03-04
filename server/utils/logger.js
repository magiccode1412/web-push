import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志目录
const LOG_DIR = path.join(__dirname, '../../data/log');

// 确保 log 目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// 告诉 winston 使用这些颜色
winston.addColors(colors);

// 根据环境确定日志级别
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'http';
};

// 定义日志格式
const format = winston.format.combine(
  // 添加时间戳
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // 错误堆栈跟踪
  winston.format.errors({ stack: true }),
  // 将日志格式化为 JSON
  winston.format.json()
);

// 控制台输出格式
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => {
      const metaStr = Object.keys(info)
        .filter(key => !['timestamp', 'level', 'message', 'service'].includes(key))
        .map(key => {
          const value = info[key];
          if (typeof value === 'object') {
            return `${key}=${JSON.stringify(value, null, 0)}`;
          }
          return `${key}=${value}`;
        })
        .join(' ');

      return metaStr
        ? `${info.timestamp} ${info.level}: ${info.message} | ${metaStr}`
        : `${info.timestamp} ${info.level}: ${info.message}`;
    }
  )
);

// 定义传输方式
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // 错误日志 - 每日轮换
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format,
  }),

  // 所有日志 - 每日轮换
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format,
  }),

  // HTTP 请求日志 - 每日轮换
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '7d',
    format,
  }),
];

// 创建 logger 实例
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

// 创建子 logger 用于不同的模块
export const createModuleLogger = (moduleName) => {
  return {
    error: (message, meta = {}) => logger.error(message, { module: moduleName, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { module: moduleName, ...meta }),
    info: (message, meta = {}) => logger.info(message, { module: moduleName, ...meta }),
    http: (message, meta = {}) => logger.http(message, { module: moduleName, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { module: moduleName, ...meta }),
  };
};

// 创建请求日志的辅助函数
export const logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
  };
  logger.http('HTTP Request', logData);
};

// 创建错误日志的辅助函数
export const logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};

// 创建信息日志的辅助函数
export const logInfo = (message, context = {}) => {
  logger.info(message, context);
};

// 创建调试日志的辅助函数
export const logDebug = (message, context = {}) => {
  logger.debug(message, context);
};

export default logger;
