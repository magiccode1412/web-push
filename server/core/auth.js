import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('AuthCore');

export async function loginCore(password) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 生产环境必须设置 ADMIN_PASSWORD 环境变量
  if (!adminPassword) {
    logger.error('未配置 ADMIN_PASSWORD 环境变量');
    throw new Error('未配置 ADMIN_PASSWORD 环境变量');
  }

  logger.debug('验证管理员密码', { hasPassword: !!password });

  if (password === adminPassword) {
    logger.info('管理员登录成功');
    return { success: true };
  }

  logger.warn('管理员登录失败: 密码错误');
  return { success: false };
}
