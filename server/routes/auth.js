import { Router } from 'express';
import { loginCore } from '../core/auth.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createModuleLogger } from '../utils/logger.js';

const router = Router();
const logger = createModuleLogger('Auth');

// 登录
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    logger.info('【登录请求】尝试管理员登录', {
      hasPassword: !!password,
      ip: req.ip || req.connection.remoteAddress
    });

    if (!password) {
      logger.warn('【登录失败】密码为空', {
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(400).json(errorResponse('密码不能为空'));
    }

    const result = await loginCore(password);

    if (!result.success) {
      logger.warn('【登录失败】密码错误', {
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(401).json(errorResponse('密码错误'));
    }

    const token = generateToken({ userId: 'admin', role: 'admin' });
    logger.info('【登录成功】管理员登录成功', {
      userId: 'admin',
      role: 'admin',
      ip: req.ip || req.connection.remoteAddress
    });

    res.json(successResponse({
      success: true,
      token
    }));
  } catch (error) {
    logger.error('【登录失败】服务器错误', {
      error: error.message,
      stack: error.stack,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json(errorResponse('登录失败，请重试'));
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    logger.info('【获取用户信息】获取当前用户', {
      userId: req.user?.userId,
      role: req.user?.role
    });
    res.json(successResponse({
      userId: req.user?.userId,
      role: req.user?.role
    }));
  } catch (error) {
    logger.error('【获取用户信息失败】', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    res.status(500).json(errorResponse('获取用户信息失败'));
  }
});

export default router;
