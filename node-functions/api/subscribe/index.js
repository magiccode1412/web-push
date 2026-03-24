import { createKVClient } from '../../kv-client.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const kvClient = createKVClient(request, env);
    const body = await request.json();
    const { userId, endpoint, keys } = body;

    // 白名单校验
    const allowedUsers = (env.ALLOWED_USERS || '').split(',').map(u => u.trim()).filter(Boolean);
    if (allowedUsers.length > 0 && !allowedUsers.includes(userId)) {
      return new Response(JSON.stringify({
        success: false,
        message: '非白名单用户拒绝订阅'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!userId || !endpoint || !keys || !keys.p256dh || !keys.auth) {
      return new Response(JSON.stringify({
        success: false,
        message: '无效的订阅信息'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = Date.now();
    const subscriptionData = JSON.stringify({ userId, endpoint, keys, createdAt: now, updatedAt: now });

    // 存储/更新订阅（以 userId 为键）
    await kvClient.set(`webpush_subscription:${userId}`, subscriptionData);
    await kvClient.sAdd('webpush_subscriptions', userId);

    console.log('订阅已保存:', userId);

    return new Response(JSON.stringify({
      success: true,
      message: '订阅成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('处理订阅错误:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
