import { Router } from 'express';
import { authMiddleware } from '../utils/jwt.js';
import { getRecordsList } from '../core/records.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createModuleLogger } from '../utils/logger.js';

const router = Router();
const logger = createModuleLogger('Records');

// 获取推送记录列表
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    logger.info('【获取推送记录】请求推送记录列表', {
      限制数量: limit,
      用户ID: req.user?.userId
    });

    const records = await getRecordsList(parseInt(limit));
    logger.info('【获取推送记录成功】返回记录列表', {
      记录数量: records.length,
      限制数量: limit
    });

    res.json(successResponse({
      success: true,
      records
    }));
  } catch (error) {
    logger.error('【获取推送记录失败】', {
      错误: error.message,
      stack: error.stack,
      用户ID: req.user?.userId
    });
    res.status(500).json(errorResponse('获取推送记录失败'));
  }
});

export default router;
