import { getDatabase, saveDatabase } from '../db/database.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('SubscribeCore');

/**
 * 保存订阅信息
 * @param {Object} subscriptionData - 订阅数据，包含 userId、endpoint、keys
 */
export async function saveSubscription(subscriptionData) {
  logger.info('【保存订阅】开始保存用户订阅', {
    用户ID: subscriptionData.userId,
    Endpoint: subscriptionData.endpoint.substring(0, 50) + '...'
  });
  const db = await getDatabase();
  const now = Date.now();

  // 先检查是否已存在该用户的订阅
  const rows = db.exec(`SELECT * FROM subscriptions WHERE user_id = '${subscriptionData.userId}'`);
  const existing = rows.length > 0 ? rows[0].values[0] : null;

  if (existing) {
    // 更新现有订阅
    db.run(`
      UPDATE subscriptions
      SET endpoint = ?, p256dh_key = ?, auth_key = ?, updated_at = ?
      WHERE user_id = ?
    `, [
      subscriptionData.endpoint,
      subscriptionData.keys.p256dh,
      subscriptionData.keys.auth,
      now,
      subscriptionData.userId
    ]);
    logger.info('【更新订阅成功】用户订阅已更新', {
      用户ID: subscriptionData.userId,
      Endpoint: subscriptionData.endpoint.substring(0, 50) + '...'
    });
  } else {
    // 插入新订阅
    db.run(`
      INSERT INTO subscriptions (user_id, endpoint, p256dh_key, auth_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      subscriptionData.userId,
      subscriptionData.endpoint,
      subscriptionData.keys.p256dh,
      subscriptionData.keys.auth,
      now,
      now
    ]);
    logger.info('【创建订阅成功】新用户已订阅', {
      用户ID: subscriptionData.userId,
      Endpoint: subscriptionData.endpoint.substring(0, 50) + '...'
    });
  }

  saveDatabase();
}

/**
 * 获取订阅列表
 * @returns {Promise<Array>} 订阅列表
 */
export async function getSubscriptionsList() {
  logger.debug('【获取订阅列表】查询数据库');
  const db = await getDatabase();

  const rows = db.exec('SELECT id, user_id, endpoint, created_at, updated_at FROM subscriptions ORDER BY created_at DESC');

  if (rows.length === 0) {
    logger.debug('【获取订阅列表】无订阅数据');
    return [];
  }

  const subscriptions = rows[0].values.map(row => ({
    id: row[0],
    userId: row[1],
    endpoint: row[2],
    createdAt: row[3],
    updatedAt: row[4]
  }));

  logger.debug('【获取订阅列表成功】返回订阅数据', {
    数量: subscriptions.length
  });
  return subscriptions;
}

/**
 * 删除订阅
 * @param {number} id - 订阅 ID
 */
export async function deleteSubscription(id) {
  logger.info('【删除订阅】从数据库删除订阅', { 订阅ID: id });
  const db = await getDatabase();

  db.run(`DELETE FROM subscriptions WHERE id = ${id}`);
  saveDatabase();
  logger.info('【删除订阅成功】订阅已删除', { 订阅ID: id });
}
