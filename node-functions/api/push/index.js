import webpush from 'web-push';
import { createKVClient } from '../../kv-client.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // PUSH_TOKEN 认证
  const PUSH_TOKEN = env.PUSH_TOKEN;
  if (PUSH_TOKEN) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${PUSH_TOKEN}`) {
      return new Response(JSON.stringify({ success: false, message: '未授权' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const VAPID_PUBLIC_KEY = env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = env.VAPID_PRIVATE_KEY;
  const EMAIL = env.EMAIL || 'admin@magicpush.com';

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ success: false, message: 'VAPID 密钥未配置' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  webpush.setVapidDetails(`mailto:${EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  try {
    const kvClient = createKVClient(request, env);
    const body = await request.json();
    const { title, content, type = 'text', imageUrl, targetUserId } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ success: false, message: '标题和内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取所有订阅用户
    const allUserIds = await kvClient.sMembers('webpush_subscriptions');

    if (!allUserIds || allUserIds.length === 0) {
      return new Response(JSON.stringify({ success: false, message: '没有找到订阅' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 确定推送目标：指定用户 or 广播全部
    const targetUserIds = targetUserId ? [targetUserId] : allUserIds;

    console.log(`共 ${allUserIds.length} 个订阅, 推送目标: ${targetUserIds.length} 个`);

    // 构造推送数据
    const pushPayload = JSON.stringify({
      title,
      content,
      type,
      imageUrl: imageUrl || '',
      timestamp: Date.now()
    });

    let pushedCount = 0;

    const pushPromises = targetUserIds.map(async (userId) => {
      try {
        const subscriptionData = await kvClient.get(`webpush_subscription:${userId}`);

        if (!subscriptionData) {
          console.log(`订阅 ${userId} 数据不存在，清理`);
          await kvClient.sRem('webpush_subscriptions', userId);
          return;
        }

        const subscription = JSON.parse(subscriptionData);

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          pushPayload,
          { TTL: 60, urgency: 'normal' }
        );

        pushedCount++;
        console.log(`推送成功: ${userId}`);
      } catch (error) {
        console.error(`推送失败 ${userId}:`, error.message);

        // 订阅失效则清理
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`订阅 ${userId} 已失效，清理`);
          await kvClient.del(`webpush_subscription:${userId}`);
          await kvClient.sRem('webpush_subscriptions', userId);
        }
      }
    });

    await Promise.all(pushPromises);

    console.log(`推送完成: 成功 ${pushedCount}`);

    return new Response(JSON.stringify({
      success: true,
      pushedCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('推送错误:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
