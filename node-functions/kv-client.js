/**
 * KV 客户端 - Node Functions 通过边缘函数访问 KV 存储
 */

class KVClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * 调用 KV 边缘函数 API
   */
  async request(action, key, value = null, ttl = null) {
    const body = { action, key };
    
    if (value !== null) {
      body.value = value;
    }
    
    if (ttl !== null) {
      body.ttl = ttl;
    }
    
    const response = await fetch(`${this.baseUrl}/kv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`KV request failed: ${response.status} ${error}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'KV operation failed');
    }
    
    return result;
  }

  /**
   * 获取值
   */
  async get(key) {
    const result = await this.request('get', key);
    return result.value;
  }

  /**
   * 设置值
   */
  async set(key, value, ttl = null) {
    return await this.request('set', key, value, ttl);
  }

  /**
   * 删除键
   */
  async del(key) {
    return await this.request('del', key);
  }

  /**
   * 添加到集合
   */
  async sAdd(key, value) {
    return await this.request('sadd', key, value);
  }

  /**
   * 从集合中移除
   */
  async sRem(key, value) {
    return await this.request('srem', key, value);
  }

  /**
   * 获取集合所有成员
   */
  async sMembers(key) {
    const result = await this.request('smembers', key);
    return result.members || [];
  }
}

/**
 * 工厂函数 - 从请求中创建 KV 客户端实例
 * @param {Request} request - 请求对象
 * @returns {KVClient} KV 客户端实例
 */
export function createKVClient(request, env) {
  const KV_EDGE_URL = env?.KV_EDGE_URL;
  const KV_API_KEY = env?.KV_API_KEY;
  
  // 优先使用环境变量配置的 Edge Function URL
  if (KV_EDGE_URL) {
    return new KVClient(KV_EDGE_URL, KV_API_KEY);
  }
  
  // 从 eo-pages-host 获取真正的前端请求域名（EdgeOne Pages 专用）
  const eoPagesHost = request.headers.get('eo-pages-host');
  
  if (!eoPagesHost) {
    throw new Error('Missing eo-pages-host header and KV_EDGE_URL env variable');
  }
  
  // 使用 eo-pages-host 构建完整的 URL
  // 判断协议：如果 host 包含端口，使用 http，否则使用 https
  const protocol = eoPagesHost.includes(':') ? 'http' : 'https';
  const baseUrl = `${protocol}://${eoPagesHost}`;
  
  return new KVClient(baseUrl, KV_API_KEY);
}
