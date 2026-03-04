import { Router } from 'express';
import { pushCore } from '../core/push.js';
import { pushAuthMiddleware } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createModuleLogger } from '../utils/logger.js';

const router = Router();
const logger = createModuleLogger('Push');

// 推送消息
router.post('/', pushAuthMiddleware, async (req, res) => {
  try {
    const { title, content, type, imageUrl, targetUserId } = req.body;
    logger.info('【推送请求】收到推送消息', {
      标题: title,
      内容: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      内容类型: type || 'text',
      是否有图片: !!imageUrl,
      目标用户: targetUserId || '广播',
      IP: req.ip || req.connection.remoteAddress
    });

    if (!title || !content) {
      logger.warn('【推送失败】标题或内容为空', {
        标题: title || '空',
        内容长度: content?.length || 0
      });
      return res.status(400).json(errorResponse('标题和内容不能为空'));
    }

    const result = await pushCore({
      title,
      content,
      type: type || 'text',
      imageUrl,
      targetUserId,
      timestamp: Date.now()
    });

    logger.info('【推送成功】消息推送完成', {
      标题: title,
      成功数量: result.pushedCount,
      总订阅数: result.totalSubscriptions,
      失效订阅: result.expiredSubscriptions
    });
    res.json(successResponse({
      success: true,
      message: '推送成功',
      pushedCount: result.pushedCount
    }));
  } catch (error) {
    logger.error('【推送失败】服务器错误', {
      标题: req.body?.title || '未知',
      错误: error.message,
      stack: error.stack
    });
    res.status(500).json(errorResponse('推送失败，请重试'));
  }
});

export default router;
