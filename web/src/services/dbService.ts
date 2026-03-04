import type { Message } from '../types'

const MESSAGES_STORE = 'messages'
const DB_NAME = 'keyval-store'
const DB_VERSION = 2

// IndexedDB 辅助函数
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = (async () => {
    const openRequest = indexedDB.open(DB_NAME, DB_VERSION)

    openRequest.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        db.createObjectStore(MESSAGES_STORE)
      }
    }

    return await promisifyRequest(openRequest)
  })()

  return dbPromise
}

export const dbService = {
  async addMessage(message: Message): Promise<void> {
    const db = await getDB()
    const tx = db.transaction(MESSAGES_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGES_STORE)
    await promisifyRequest(store.put(message, `${MESSAGES_STORE}:${message.id}`))
    await promisifyTransaction(tx)
  },

  async getMessage(id: string): Promise<Message | undefined> {
    const db = await getDB()
    const tx = db.transaction(MESSAGES_STORE, 'readonly')
    const store = tx.objectStore(MESSAGES_STORE)
    return await promisifyRequest(store.get(`${MESSAGES_STORE}:${id}`))
  },

  async getAllMessages(): Promise<Message[]> {
    try {
      const db = await getDB()
      const tx = db.transaction(MESSAGES_STORE, 'readonly')
      const store = tx.objectStore(MESSAGES_STORE)

      const allKeys = await promisifyRequest(store.getAllKeys())
      const messageKeys = allKeys
        .filter((key): key is string => typeof key === 'string' && key.startsWith(MESSAGES_STORE))
        .map((key) => key.toString())

      const messages = await Promise.all(
        messageKeys.map((key) => promisifyRequest(store.get(key)))
      )

      return messages
        .filter((msg): msg is Message => msg !== undefined)
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('获取所有消息失败:', error)
      return []
    }
  },

  async updateMessage(id: string, updates: Partial<Message>): Promise<void> {
    const message = await this.getMessage(id)
    if (message) {
      const updated = { ...message, ...updates }
      const db = await getDB()
      const tx = db.transaction(MESSAGES_STORE, 'readwrite')
      const store = tx.objectStore(MESSAGES_STORE)
      await promisifyRequest(store.put(updated, `${MESSAGES_STORE}:${id}`))
      await promisifyTransaction(tx)
    }
  },

  async deleteMessage(id: string): Promise<void> {
    const db = await getDB()
    const tx = db.transaction(MESSAGES_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGES_STORE)
    await promisifyRequest(store.delete(`${MESSAGES_STORE}:${id}`))
    await promisifyTransaction(tx)
  },

  async deleteMessages(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.deleteMessage(id)))
  },

  async clearAllMessages(): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction(MESSAGES_STORE, 'readwrite')
      const store = tx.objectStore(MESSAGES_STORE)

      const allKeys = await promisifyRequest(store.getAllKeys())
      const messageKeys = allKeys.filter(
        (key): key is string => typeof key === 'string' && key.startsWith(MESSAGES_STORE)
      )

      await Promise.all(
        messageKeys.map((key) => promisifyRequest(store.delete(key)))
      )
      await promisifyTransaction(tx)
    } catch (error) {
      console.error('清空所有消息失败:', error)
      throw error
    }
  },

  async markAsRead(id: string): Promise<void> {
    await this.updateMessage(id, { read: true })
  },

  async markAllAsRead(): Promise<void> {
    const messages = await this.getAllMessages()
    await Promise.all(
      messages.filter((msg) => !msg.read).map((msg) => this.markAsRead(msg.id))
    )
  }
}
