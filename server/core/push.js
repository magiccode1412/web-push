import webPush from 'web-push';
import { getDatabase, saveDatabase } from '../db/database.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('PushCore');

/**
 * 推送核心逻辑
 * @param {Object} pushData - 推送数据对象，包含 title、content、targetUserId 等字段
 * @returns {Promise<Object>} 返回推送结果，包含 success 和 pushedCount
 */
export async function pushCore(pushData) {
  const isBroadcast = !pushData.targetUserId;
  logger.info('【推送开始】开始执行推送', {
    标题: pushData.title,
    内容长度: pushData.content?.length || 0,
    推送类型: isBroadcast ? '广播' : `定向推送(${pushData.targetUserId})`,
    是否有图片: !!pushData.imageUrl
  });

  // 1. 配置 VAPID 密钥
  webPush.setVapidDetails(
    'mailto:admin@magicpush.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const db = await getDatabase();

  // 2. 保存推送记录到数据库
  db.run(`
    INSERT INTO push_records (title, content, content_type, image_url, target_user_id, pushed_count, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    pushData.title,
    pushData.content,
    pushData.type || 'text',
    pushData.imageUrl || null,
    pushData.targetUserId || null,
    0,
    Math.floor(Date.now() / 1000)
  ]);

  const result = db.exec('SELECT last_insert_rowid() as id');
  const recordId = result[0].values[0][0];
  logger.debug('【保存推送记录】已创建记录', { 记录ID: recordId });

  // 3. 获取目标订阅列表
  let targetSubscriptions = [];

  if (pushData.targetUserId) {
    // 如果指定了目标用户ID，直接获取该用户的订阅记录
    const rows = db.exec(`SELECT * FROM subscriptions WHERE user_id = '${pushData.targetUserId}'`);
    if (rows.length > 0) {
      targetSubscriptions = rows[0].values.map(row => ({
        id: row[0],
        user_id: row[1],
        endpoint: row[2],
        p256dh_key: row[3],
        auth_key: row[4],
        created_at: row[5],
        updated_at: row[6]
      }));
    }
    logger.debug('【获取目标订阅】获取指定用户订阅', {
      用户ID: pushData.targetUserId,
      订阅数量: targetSubscriptions.length
    });
  } else {
    // 广播推送：获取所有订阅记录
    const rows = db.exec('SELECT * FROM subscriptions');
    if (rows.length > 0) {
      targetSubscriptions = rows[0].values.map(row => ({
        id: row[0],
        user_id: row[1],
        endpoint: row[2],
        p256dh_key: row[3],
        auth_key: row[4],
        created_at: row[5],
        updated_at: row[6]
      }));
    }
    logger.debug('【获取所有订阅】获取全部订阅', {
      订阅总数: targetSubscriptions.length
    });
  }

  // 4. 遍历目标订阅，发送推送消息
  const payload = JSON.stringify({
    title: pushData.title,
    content: pushData.content,
    type: pushData.type || 'text',
    imageUrl: pushData.imageUrl,
    id: recordId
  });

  let pushedCount = 0;
  const expiredSubscriptions = [];

  for (const subscription of targetSubscriptions) {
    try {
      const webPushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      };

      await webPush.sendNotification(webPushSubscription, payload);
      pushedCount++;
      logger.debug('【推送成功】消息已发送', {
        用户ID: subscription.user_id,
        Endpoint: subscription.endpoint.substring(0, 30) + '...'
      });
    } catch (error) {
      logger.error('【推送失败】消息发送失败', {
        用户ID: subscription.user_id,
        Endpoint: subscription.endpoint.substring(0, 30) + '...',
        错误码: error.statusCode || '未知',
        错误信息: error.message
      });

      // 如果是以下错误之一，说明订阅已失效，需要清理
      // 410 Gone - 订阅已过期
      // 404 Not Found - 订阅不存在
      // ENOTFOUND - 域名解析失败（endpoint 已失效）
      // ECONNREFUSED - 连接被拒绝
      // ETIMEDOUT - 连接超时
      const shouldDeleteSubscription =
        error.statusCode === 410 ||
        error.statusCode === 404 ||
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT') ||
        subscription.endpoint?.includes('permanently-removed');

      if (shouldDeleteSubscription) {
        expiredSubscriptions.push(subscription.id);
        logger.info('【标记失效订阅】订阅将被清理', {
          订阅ID: subscription.id,
          用户ID: subscription.user_id,
          原因: error.message
        });
      }
    }
  }

  // 清理失效的订阅
  if (expiredSubscriptions.length > 0) {
    logger.info(`【清理失效订阅】清理 ${expiredSubscriptions.length} 个失效订阅`, {
      订阅ID: expiredSubscriptions.join(', ')
    });
    expiredSubscriptions.forEach(subId => {
      db.run(`DELETE FROM subscriptions WHERE id = ${subId}`);
    });
  }

  // 5. 更新推送成功次数
  db.run(`UPDATE push_records SET pushed_count = ${pushedCount} WHERE id = ${recordId}`);

  saveDatabase();

  const resultData = {
    success: true,
    pushedCount,
    totalSubscriptions: targetSubscriptions.length,
    expiredSubscriptions: expiredSubscriptions.length,
    activeSubscriptions: targetSubscriptions.length - expiredSubscriptions.length
  };

  logger.info('【推送完成】推送任务结束', {
    标题: pushData.title,
    成功数量: pushedCount,
    总订阅数: targetSubscriptions.length,
    失效订阅: expiredSubscriptions.length
  });
  return resultData;
}
