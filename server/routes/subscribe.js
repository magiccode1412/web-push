import { Router } from 'express';
import { saveSubscription, getSubscriptionsList, deleteSubscription } from '../core/subscribe.js';
import { authMiddleware } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createModuleLogger } from '../utils/logger.js';

const router = Router();
const logger = createModuleLogger('Subscribe');

// 订阅推送
router.post('/', async (req, res) => {
  try {
    const { userId, endpoint, keys } = req.body;
    logger.info('【订阅请求】收到新的订阅', {
      用户ID: userId,
      Endpoint: endpoint.substring(0, 50) + '...',
      有密钥: !!keys,
      IP: req.ip || req.connection.remoteAddress
    });

    if (!userId || !endpoint || !keys) {
      logger.warn('【订阅失败】订阅信息不完整', {
        用户ID: userId || '缺失',
        Endpoint: endpoint || '缺失',
        密钥: keys || '缺失'
      });
      return res.status(400).json(errorResponse('订阅信息不完整'));
    }

    await saveSubscription({
      userId,
      endpoint,
      keys
    });

    logger.info('【订阅成功】用户订阅完成', {
      用户ID: userId
    });
    res.json(successResponse({
      success: true,
      message: '订阅成功'
    }));
  } catch (error) {
    logger.error('【订阅失败】服务器错误', {
      用户ID: req.body?.userId || '未知',
      错误: error.message,
      stack: error.stack
    });
    res.status(500).json(errorResponse('订阅失败，请重试'));
  }
});

// 获取订阅列表 (需要认证)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    logger.info('【获取订阅列表】管理员请求订阅列表', {
      操作用户: req.user?.userId
    });
    const subscriptions = await getSubscriptionsList();
    logger.info('【获取订阅列表成功】返回订阅数据', {
      订阅数量: subscriptions.length,
      操作用户: req.user?.userId
    });
    res.json(successResponse({
      success: true,
      subscriptions
    }));
  } catch (error) {
    logger.error('【获取订阅列表失败】', {
      错误: error.message,
      stack: error.stack,
      操作用户: req.user?.userId
    });
    res.status(500).json(errorResponse('获取订阅列表失败'));
  }
});

// 删除订阅 (需要认证)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('【删除订阅】管理员删除订阅', {
      订阅ID: id,
      操作用户: req.user?.userId
    });
    await deleteSubscription(id);
    logger.info('【删除订阅成功】订阅已删除', {
      订阅ID: id,
      操作用户: req.user?.userId
    });
    res.json(successResponse({
      success: true,
      message: '删除成功'
    }));
  } catch (error) {
    logger.error('【删除订阅失败】', {
      订阅ID: req.params?.id,
      错误: error.message,
      stack: error.stack,
      操作用户: req.user?.userId
    });
    res.status(500).json(errorResponse('删除订阅失败'));
  }
});

export default router;
