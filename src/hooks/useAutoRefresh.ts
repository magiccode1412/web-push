import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'auto_refresh_interval'
const DEFAULT_INTERVAL = 10 // 默认10秒

/**
 * 获取自动刷新间隔（秒）
 */
export function getRefreshInterval(): number {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 3600) return parsed
  }
  return DEFAULT_INTERVAL
}

/**
 * 设置自动刷新间隔（秒）
 */
export function setRefreshInterval(seconds: number): void {
  const clamped = Math.max(1, Math.min(3600, seconds))
  localStorage.setItem(STORAGE_KEY, String(clamped))
}

/**
 * 自动刷新 Hook
 * 每隔 n 秒（默认10秒）执行回调函数，间隔可从 localStorage 读取/设置
 *
 * @param callback 需要定期执行的回调（如重新加载数据）
 * @param enabled 是否启用自动刷新（默认 true）
 */
export function useAutoRefresh(callback: () => void, enabled: boolean = true) {
  const [interval, setIntervalState] = useState(getRefreshInterval())
  const callbackRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 保持 callback 引用最新
  useEffect(() => { callbackRef.current = callback }, [callback])

  // 监听 storage 事件（跨 tab 同步间隔变化）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsed = parseInt(e.newValue, 10)
        if (!isNaN(parsed)) {
          setIntervalState(Math.max(1, Math.min(3600, parsed)))
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 定时刷新逻辑
  useEffect(() => {
    if (!enabled || interval <= 0) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }

    timerRef.current = setInterval(() => {
      console.log(`[auto-refresh] 定时触发 | 间隔: ${interval}s | 时间: ${new Date().toLocaleString('zh-CN')}`)
      callbackRef.current()
    }, interval * 1000)

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [interval, enabled])

  // 提供手动更新间隔的方法
  const updateInterval = useCallback((seconds: number) => {
    setRefreshInterval(seconds)
    setIntervalState(Math.max(1, Math.min(3600, seconds)))
  }, [])

  return { interval, updateInterval } as const
}
