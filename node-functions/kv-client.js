/**
 * KV 客户端 - Node Functions 直接通过 KV_DEFAULT 全局变量访问 KV 存储
 * 与 Edge Functions 使用相同的调用方式
 */

class KVClient {
  constructor() {
    // KV_DEFAULT 是绑定的 KV 命名空间，作为全局变量使用
  }

  /**
   * 获取值
   */
  async get(key) {
    return await KV_DEFAULT.get(key);
  }

  /**
   * 设置值
   * @param {string} key - 键
   * @param {string} value - 值
   * @param {number|null} ttl - 过期时间（秒）
   */
  async set(key, value, ttl = null) {
    const options = ttl ? { expirationTtl: ttl } : undefined;
    await KV_DEFAULT.put(key, value, options);
  }

  /**
   * 删除键
   */
  async del(key) {
    await KV_DEFAULT.delete(key);
  }

  /**
   * 添加到集合（使用 JSON 数组模拟 Set）
   */
  async sAdd(key, value) {
    let set = await KV_DEFAULT.get(key);
    let arr = set ? JSON.parse(set) : [];

    if (!arr.includes(value)) {
      arr.push(value);
      await KV_DEFAULT.put(key, JSON.stringify(arr));
    }
  }

  /**
   * 从集合中移除（使用 JSON 数组模拟 Set）
   */
  async sRem(key, value) {
    let set = await KV_DEFAULT.get(key);
    if (set) {
      let arr = JSON.parse(set);
      arr = arr.filter(item => item !== value);
      await KV_DEFAULT.put(key, JSON.stringify(arr));
    }
  }

  /**
   * 获取集合所有成员
   */
  async sMembers(key) {
    let set = await KV_DEFAULT.get(key);
    return set ? JSON.parse(set) : [];
  }
}

/**
 * 工厂函数 - 创建 KV 客户端实例
 * @returns {KVClient} KV 客户端实例
 */
export function createKVClient() {
  return new KVClient();
}
