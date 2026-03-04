import { getDatabase } from '../db/database.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('RecordsCore');

/**
 * 获取推送记录列表
 * @param {number} limit - 返回记录数量限制
 * @returns {Promise<Array>} 推送记录列表
 */
export async function getRecordsList(limit = 50) {
  logger.debug('获取推送记录列表', { limit });
  const db = await getDatabase();

  const rows = db.exec(`SELECT * FROM push_records ORDER BY timestamp DESC LIMIT ${limit}`);

  if (rows.length === 0) {
    logger.debug('推送记录列表为空');
    return [];
  }

  const records = rows[0].values.map(row => ({
    id: `magic_push_record:${row[0]}`,
    title: row[1],
    content: row[2],
    imageUrl: row[3],
    targetUserId: row[4],
    timestamp: row[6]
  }));

  logger.info('获取推送记录列表成功', { count: records.length });
  return records;
}
