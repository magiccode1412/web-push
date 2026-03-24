// This is for workbox to inject manifest - DO NOT REMOVE OR MODIFY
self.__WB_MANIFEST

// IndexedDB helper functions
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result)
    request.onabort = request.onerror = () => reject(request.error)
  })
}

const MESSAGES_STORE = 'messages'

const dbService = {
  async addMessage(message) {
    const db = await this.getDB()
    const tx = db.transaction(MESSAGES_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGES_STORE)
    await promisifyRequest(store.put(message, `${MESSAGES_STORE}:${message.id}`))
    await promisifyRequest(tx)
  },

  async getMessage(id) {
    const db = await this.getDB()
    const tx = db.transaction(MESSAGES_STORE, 'readonly')
    const store = tx.objectStore(MESSAGES_STORE)
    return await promisifyRequest(store.get(`${MESSAGES_STORE}:${id}`))
  },

  async getAllMessages() {
    const db = await this.getDB()
    const tx = db.transaction(MESSAGES_STORE, 'readonly')
    const store = tx.objectStore(MESSAGES_STORE)

    const allKeys = await promisifyRequest(store.getAllKeys())
    const messageKeys = allKeys
      .filter((key) => typeof key === 'string' && key.startsWith(MESSAGES_STORE))
      .map((key) => key.toString())

    const messages = await Promise.all(
      messageKeys.map((key) => promisifyRequest(store.get(key)))
    )

    return messages
      .filter((msg) => msg !== undefined)
      .sort((a, b) => b.timestamp - a.timestamp)
  },

  async updateMessage(id, updates) {
    const message = await this.getMessage(id)
    if (message) {
      const updated = { ...message, ...updates }
      const db = await this.getDB()
      const tx = db.transaction(MESSAGES_STORE, 'readwrite')
      const store = tx.objectStore(MESSAGES_STORE)
      await promisifyRequest(store.put(updated, `${MESSAGES_STORE}:${id}`))
      await promisifyRequest(tx)
    }
  },

  async deleteMessage(id) {
    const db = await this.getDB()
    const tx = db.transaction(MESSAGES_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGES_STORE)
    await promisifyRequest(store.delete(`${MESSAGES_STORE}:${id}`))
    await promisifyRequest(tx)
  },

  async deleteMessages(ids) {
    await Promise.all(ids.map((id) => this.deleteMessage(id)))
  },

  async clearAllMessages() {
    const db = await this.getDB()
    const tx = db.transaction(MESSAGES_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGES_STORE)

    const allKeys = await promisifyRequest(store.getAllKeys())
    const messageKeys = allKeys.filter(
      (key) => typeof key === 'string' && key.startsWith(MESSAGES_STORE)
    )

    await Promise.all(
      messageKeys.map((key) => promisifyRequest(store.delete(key)))
    )
    await promisifyRequest(tx)
  },

  async markAsRead(id) {
    await this.updateMessage(id, { read: true })
  },

  async markAllAsRead() {
    const messages = await this.getAllMessages()
    await Promise.all(
      messages.filter((msg) => !msg.read).map((msg) => this.markAsRead(msg.id))
    )
  }
}

let dbPromise
dbService.getDB = function() {
  if (dbPromise) return dbPromise
  dbPromise = (async () => {
    const openRequest = indexedDB.open('keyval-store')
    const db = await promisifyRequest(openRequest)
    if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
      db.close()
      const openRequest2 = indexedDB.open('keyval-store', 2)
      openRequest2.onupgradeneeded = (event) => {
        const db2 = event.target.result
        if (!db2.objectStoreNames.contains(MESSAGES_STORE)) {
          db2.createObjectStore(MESSAGES_STORE)
        }
      }
      return await promisifyRequest(openRequest2)
    }
    return db
  })()
  return dbPromise
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', async (event) => {
  try {
    let data = {
      title: '新消息',
      content: '您收到一条新消息',
      timestamp: Date.now()
    }

    if (event.data) {
      try {
        const parsed = JSON.parse(event.data.text())
        data = { ...data, ...parsed }
      } catch (e) {
        console.error('解析推送数据失败:', e)
      }
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title,
      content: data.content,
      type: data.type || 'text',
      imageUrl: data.imageUrl,
      timestamp: data.timestamp,
      read: false
    }

    const notificationOptions = {
      body: data.content,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        messageId: message.id,
        timestamp: message.timestamp
      },
      requireInteraction: false,
      silent: false
    }

    await self.registration.showNotification(data.title, notificationOptions)

    try {
      await dbService.addMessage(message)
    } catch (error) {
      console.error('存储消息到 IndexedDB 失败:', error)
    }
  } catch (error) {
    console.error('处理推送失败:', error)
  }
})

self.addEventListener('notificationclick', async (event) => {
  console.log('[SW] notificationclick 事件触发')
  event.notification.close()
  console.log('[SW] 通知已关闭')

  const messageId = event.notification.data?.messageId
  const targetUrl = messageId ? `/detail/${messageId}` : '/'
  console.log('[SW] messageId:', messageId, '目标URL:', targetUrl)

  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  console.log('[SW] 找到的客户端数量:', clients.length)

  if (clients.length > 0) {
    // 发送消息让页面自己导航（不依赖 focus）
    const client = clients[0]
    console.log('[SW] 发送导航消息到客户端:', targetUrl)

    try {
      await client.postMessage({
        type: 'NAVIGATE',
        url: targetUrl,
        messageId: messageId
      })
      console.log('[SW] 导航消息已发送')
    } catch (error) {
      console.log('[SW] 发送消息失败:', error.message)
    }
  }

  // 同时尝试打开/聚焦窗口（可能被浏览器阻止）
  try {
    const newWindow = await self.clients.openWindow(targetUrl)
    console.log('[SW] 打开窗口成功:', newWindow)
  } catch (error) {
    console.log('[SW] 打开窗口失败（可能是浏览器安全限制）:', error.message)
    // 如果打开了客户端，postMessage 已经发送，页面会处理导航
    console.log('[SW] 导航将通过客户端消息处理')
  }
})
