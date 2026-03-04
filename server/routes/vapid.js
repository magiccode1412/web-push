import { Router } from 'express';
import { successResponse, errorResponse } from '../utils/response.js';
import { createModuleLogger } from '../utils/logger.js';

const router = Router();
const logger = createModuleLogger('VAPID');

// 获取 VAPID 公钥
router.get('/', async (req, res) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      logger.warn('【获取VAPID公钥失败】服务器未配置公钥');
      return res.status(500).json(errorResponse('服务器未配置 VAPID 公钥'));
    }

    logger.info('【获取VAPID公钥成功】返回公钥', {
      IP: req.ip || req.connection.remoteAddress
    });
    res.json(successResponse({
      publicKey: vapidPublicKey
    }));
  } catch (error) {
    logger.error('【获取VAPID公钥失败】服务器错误', {
      错误: error.message,
      stack: error.stack
    });
    res.status(500).json(errorResponse('获取 VAPID 公钥失败'));
  }
});

export default router;
