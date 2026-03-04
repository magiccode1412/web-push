import type { PushSubscriptionJSON } from '../push-types'
import { debugService } from './debugService'

// 获取或生成用户ID（持久化保存）
function getUserId(): string {
  const STORAGE_KEY = 'push_user_id'
  let userId = localStorage.getItem(STORAGE_KEY)

  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem(STORAGE_KEY, userId)
    debugService.info('push', '生成新的用户ID', { userId })
  }

  return userId
}

// 检测是否为 Edge 移动端
function isEdgeMobile(userAgent: string): boolean {
  return /EdgA\//.test(userAgent) && /Mobile/.test(userAgent);
}

export const pushService = {
  async getVapidPublicKey(): Promise<string> {
    debugService.info('api', '开始获取 VAPID 公钥');
    try {
      const response = await fetch('/api/vapid-key');
      debugService.logApiResponse('/api/vapid-key', response.status);
      
      if (!response.ok) {
        throw new Error('获取 VAPID 公钥失败');
      }
      
      const data = await response.json();
      debugService.success('api', 'VAPID 公钥获取成功', { hasPublicKey: !!data.publicKey });
      return data.publicKey;
    } catch (error) {
      debugService.error('api', '获取 VAPID 公钥失败', undefined, error as Error);
      throw new Error('无法从服务器获取 VAPID 公钥');
    }
  },

  async requestPermission(): Promise<NotificationPermission> {
    debugService.info('permission', '检查通知API支持');
    
    if (!('Notification' in window)) {
      debugService.error('permission', '浏览器不支持通知功能');
      throw new Error('浏览器不支持通知功能');
    }

    debugService.info('permission', '请求通知权限');
    const permission = await Notification.requestPermission();
    debugService.logPermissionRequest(permission);
    
    return permission;
  },

  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  },

  async subscribe(): Promise<PushSubscriptionJSON | null> {
    debugService.info('push', '开始推送订阅流程');

    // 检测浏览器能力
    const capabilities = {
      'Service Worker': 'serviceWorker' in navigator,
      'Push API': 'PushManager' in window,
      'Notifications': 'Notification' in window,
      'HTTPS': window.location.protocol === 'https:',
      'User Agent': navigator.userAgent
    };
    debugService.info('push', '浏览器能力检测结果', capabilities);
    
    if (!('serviceWorker' in navigator)) {
      const error = new Error('浏览器不支持 Service Worker');
      debugService.error('serviceWorker', 'Service Worker 不支持', capabilities, error);
      throw error;
    }

    try {
      // 请求权限
      debugService.info('push', '步骤 1: 请求通知权限');
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        const error = new Error(`用户拒绝了推送权限: ${permission}`);
        debugService.warning('permission', '权限未授予', { permission });
        throw error;
      }

      // 获取 VAPID 公钥
      debugService.info('push', '步骤 2: 获取 VAPID 公钥');
      const vapidPublicKey = await this.getVapidPublicKey();

      // 获取 Service Worker 注册
      debugService.info('push', '步骤 3: 等待 Service Worker 就绪');
      const registration = await navigator.serviceWorker.ready;
      debugService.success('serviceWorker', 'Service Worker 已就绪', {
        scope: registration.scope,
        active: !!registration.active,
        state: registration.active?.state
      });

      // 获取现有订阅
      debugService.info('push', '步骤 4: 检查现有订阅');
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        debugService.info('push', '发现现有订阅', {
          endpoint: subscription.endpoint,
          options: subscription.options
        });
      }

      // 如果没有订阅，创建新订阅
      if (!subscription) {
        debugService.info('push', '步骤 5: 创建新的推送订阅');
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
          });
          debugService.success('push', '推送订阅创建成功', {
            endpoint: subscription.endpoint
          });
        } catch (error) {
          debugService.error('push', '创建推送订阅失败', undefined, error as Error);
          throw error;
        }
      }

      // 检测无效的 endpoint
      const endpoint = subscription.endpoint;
      const invalidPatterns = [
        'permanently-removed.invalid',
        'invalid',
        'null',
        'undefined'
      ];

      if (invalidPatterns.some(pattern => endpoint.includes(pattern))) {
        debugService.error('push', '检测到无效的 endpoint', {
          endpoint,
          isEdgeMobile: /EdgA\//.test(navigator.userAgent)
        });

        const errorMsg = isEdgeMobile(navigator.userAgent)
          ? 'Edge 移动端不支持 Web Push，请使用 Chrome 浏览器'
          : '无效的推送订阅 endpoint';

        throw new Error(errorMsg);
      }

      const subscriptionJSON = subscription.toJSON();
      debugService.info('push', '步骤 6: 序列化订阅信息', subscriptionJSON);

      // 发送到服务器
      if (subscriptionJSON.endpoint) {
        debugService.info('push', '步骤 7: 发送订阅信息到服务器');
        await this.sendSubscriptionToServer({
          endpoint: subscriptionJSON.endpoint,
          expirationTime: subscriptionJSON.expirationTime,
          keys: subscriptionJSON.keys || { p256dh: '', auth: '' }
        });
        debugService.success('push', '订阅信息已发送到服务器');
      }

      debugService.logPushSubscribe('subscribed', { endpoint: subscriptionJSON.endpoint });
      
      return {
        endpoint: subscriptionJSON.endpoint || '',
        expirationTime: subscriptionJSON.expirationTime,
        keys: subscriptionJSON.keys || { p256dh: '', auth: '' }
      };
    } catch (error) {
      debugService.logPushSubscribe('failed', undefined, error as Error);
      console.error('订阅推送失败:', error);
      return null;
    }
  },

  async sendSubscriptionToServer(subscription: PushSubscriptionJSON): Promise<void> {
    debugService.info('api', '发送订阅信息到服务器', {
      endpoint: subscription.endpoint,
      hasKeys: !!subscription.keys
    });
    
    try {
      debugService.logApiRequest('/api/subscribe', 'POST', {
        userId: getUserId(),
        endpoint: subscription.endpoint,
        hasKeys: !!subscription.keys
      });
      
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: getUserId(),
          endpoint: subscription.endpoint,
          keys: subscription.keys
        })
      });
      
      debugService.logApiResponse('/api/subscribe', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`服务器响应错误: ${response.status} - ${errorText}`);
      }
      
      debugService.success('api', '订阅信息发送成功');
    } catch (error) {
      debugService.error('network', '发送订阅信息到服务器失败', undefined, error as Error);
      throw error;
    }
  },

  async unsubscribe(): Promise<void> {
    debugService.info('push', '开始取消订阅流程');
    
    if (!('serviceWorker' in navigator)) {
      debugService.warning('serviceWorker', '浏览器不支持 Service Worker，无法取消订阅');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        debugService.logPushSubscribe('unsubscribed', {
          endpoint: subscription.endpoint
        });
        debugService.success('push', '取消订阅成功');
      } else {
        debugService.info('push', '没有找到活跃的订阅');
      }
    } catch (error) {
      debugService.error('push', '取消订阅失败', undefined, error as Error);
    }
  }
}
