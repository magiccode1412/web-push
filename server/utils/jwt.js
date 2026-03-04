import jwt from 'jsonwebtoken';
import { createModuleLogger } from './logger.js';

const logger = createModuleLogger('JWT');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// 生成 token
export function generateToken(payload) {
  logger.debug('生成 token', { userId: payload.userId });
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// 验证 token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.warn('Token 验证失败', { error: error.name });
    if (error.name === 'TokenExpiredError') {
      throw new Error('令牌已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('无效的签名');
    }
    throw new Error('令牌验证失败');
  }
}

// 认证中间件
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('认证失败: 未提供认证令牌');
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.user = payload;
    logger.debug('认证成功', { userId: payload.userId });
    next();
  } catch (error) {
    logger.error('认证失败', { error: error.message });
    return res.status(401).json({
      success: false,
      message: error.message || '认证失败'
    });
  }
}

// 推送令牌验证中间件
export function pushAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('推送认证失败: 未提供认证令牌');
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);
  const pushToken = process.env.PUSH_TOKEN;

  if (!pushToken) {
    logger.error('未配置 PUSH_TOKEN 环境变量');
    return res.status(500).json({ success: false, message: '未配置 PUSH_TOKEN 环境变量' });
  }

  if (token !== pushToken) {
    logger.warn('推送认证失败: 无效的推送令牌');
    return res.status(401).json({ success: false, message: '无效的推送令牌' });
  }

  logger.debug('推送认证成功');
  next();
}
