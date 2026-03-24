/**
 * KV 存储边缘函数 - 为 Node Functions 提供 KV 存储接口
 * 使用 API Key 进行身份验证
 */

// 验证 API Key
const validateAuth = (request, env) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }
  
  // 支持 Bearer token 格式
  const token = authHeader.replace('Bearer ', '');
  return token === env.KV_API_KEY;
};

// 主处理函数
export async function onRequest({request, env}) {
  
  // 验证身份
  if (!validateAuth(request, env)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Unauthorized' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // 解析请求
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/kv', '').replace('/kv', '');
    const method = request.method;
    
    // GET /kv/{key} - 获取值
    if (method === 'GET' && path && path !== '/') {
      const key = path.replace(/^\//, '');
      const value = await KV_DEFAULT.get(key);
      
      return new Response(JSON.stringify({ 
        success: true, 
        value: value 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST /kv - 设置值或操作集合
    if (method === 'POST') {
      const body = await request.json();
      const { action, key, value, ttl } = body;
      
      if (!key) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Key is required' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      switch (action) {
        case 'set':
          // 设置键值
          const options = ttl ? { expirationTtl: ttl } : undefined;
          await KV_DEFAULT.put(key, value, options);
          
          return new Response(JSON.stringify({ 
            success: true,
            message: 'OK'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'get':
          // 获取值
          const result = await KV_DEFAULT.get(key);
          return new Response(JSON.stringify({ 
            success: true,
            value: result 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'del':
          // 删除键
          await KV_DEFAULT.delete(key);
          return new Response(JSON.stringify({ 
            success: true,
            message: 'OK'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'sadd':
          // 添加到集合 - 使用 JSON 数组存储
          let set = await KV_DEFAULT.get(key);
          let arr = set ? JSON.parse(set) : [];
          
          if (!arr.includes(value)) {
            arr.push(value);
            await KV_DEFAULT.put(key, JSON.stringify(arr));
          }
          
          return new Response(JSON.stringify({ 
            success: true,
            message: 'OK'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'srem':
          // 从集合中移除
          let setRem = await KV_DEFAULT.get(key);
          if (setRem) {
            let arrRem = JSON.parse(setRem);
            arrRem = arrRem.filter(item => item !== value);
            await KV_DEFAULT.put(key, JSON.stringify(arrRem));
          }
          
          return new Response(JSON.stringify({ 
            success: true,
            message: 'OK'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'smembers':
          // 获取集合所有成员
          let setMembers = await KV_DEFAULT.get(key);
          let members = setMembers ? JSON.parse(setMembers) : [];
          
          return new Response(JSON.stringify({ 
            success: true,
            members: members 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        default:
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid action' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    
    // DELETE /kv/{key} - 删除键
    if (method === 'DELETE' && path && path !== '/') {
      const key = path.replace(/^\//, '');
      await KV_DEFAULT.delete(key);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'OK'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Not found' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('KV Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
