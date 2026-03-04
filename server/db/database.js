import initSqlJsModule from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createModuleLogger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'push.db');

const logger = createModuleLogger('Database');

// 确保 data 目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  logger.info('创建数据目录', { path: DB_DIR });
}

// 数据库实例
let db = null;
let SQL = null;

// 初始化 SQL.js
async function initSqlJs() {
  if (!SQL) {
    logger.debug('初始化 SQL.js');
    SQL = await initSqlJsModule();
  }
}

export async function getDatabase() {
  if (!db) {
    await initSqlJs();

    // 检查数据库文件是否存在
    if (fs.existsSync(DB_PATH)) {
      logger.debug('加载现有数据库', { path: DB_PATH });
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      logger.info('创建新数据库', { path: DB_PATH });
      db = new SQL.Database();
      saveDatabase();
    }
  }
  return db;
}

// 保存数据库到文件
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// 初始化数据库表
export async function initDatabase() {
  logger.info('开始初始化数据库');
  const db = await getDatabase();

  // 创建订阅表
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh_key TEXT NOT NULL,
      auth_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id)
    )
  `);
  logger.debug('创建订阅表成功');

  // 创建推送记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS push_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_type TEXT DEFAULT 'text',
      image_url TEXT,
      target_user_id TEXT,
      pushed_count INTEGER DEFAULT 0,
      timestamp INTEGER NOT NULL
    )
  `);
  logger.debug('创建推送记录表成功');

  // 迁移：为已存在的表添加 content_type 字段
  try {
    const columns = db.exec("PRAGMA table_info(push_records)");
    if (columns.length > 0) {
      const hasContentType = columns[0].values.some(col => col[1] === 'content_type');
      if (!hasContentType) {
        db.run('ALTER TABLE push_records ADD COLUMN content_type TEXT DEFAULT \'text\'');
        logger.info('数据库迁移：添加 content_type 字段');
      }
    }
  } catch (e) {
    logger.debug('检查 content_type 字段跳过（表可能不存在）');
  }

  // 创建索引以提高查询性能
  db.run(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_push_records_timestamp ON push_records(timestamp DESC)`);
  logger.debug('创建数据库索引成功');

  saveDatabase();
  logger.info('数据库初始化完成');
}

// 关闭数据库连接
export async function closeDatabase() {
  if (db) {
    logger.info('关闭数据库连接');
    saveDatabase();
    db.close();
    db = null;
  }
}
