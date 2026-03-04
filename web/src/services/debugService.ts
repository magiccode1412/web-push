export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  category: 'push' | 'permission' | 'serviceWorker' | 'api' | 'network' | 'general';
  message: string;
  details?: Record<string, any>;
  error?: Error;
}

class DebugService {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private storageKey = 'debug_logs';
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save logs:', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  private addLog(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    details?: Record<string, any>,
    error?: Error
  ) {
    const log: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    this.logs.push(log);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.saveLogs();
    this.notifyListeners();

    // Also log to console
    const consoleMethod = level === 'error' ? console.error :
                         level === 'warning' ? console.warn :
                         level === 'success' ? console.log :
                         console.info;
    consoleMethod(`[${category.toUpperCase()}] ${message}`, details || '', error || '');

    return log;
  }

  info(category: LogEntry['category'], message: string, details?: Record<string, any>) {
    return this.addLog('info', category, message, details);
  }

  success(category: LogEntry['category'], message: string, details?: Record<string, any>) {
    return this.addLog('success', category, message, details);
  }

  warning(category: LogEntry['category'], message: string, details?: Record<string, any>) {
    return this.addLog('warning', category, message, details);
  }

  error(category: LogEntry['category'], message: string, details?: Record<string, any>, error?: Error) {
    return this.addLog('error', category, message, details, error);
  }

  // Specialized methods for common scenarios
  logBrowserCapabilities(capabilities: Record<string, boolean | string>) {
    this.info('general', '浏览器能力检测', capabilities);
  }

  logPermissionRequest(result: NotificationPermission) {
    const level = result === 'granted' ? 'success' : 'warning';
    this[level]('permission', `通知权限请求结果: ${result}`, { result });
  }

  logServiceWorkerState(state: 'registering' | 'registered' | 'error', details?: Record<string, any>) {
    const level = state === 'error' ? 'error' : state === 'registered' ? 'success' : 'info';
    this[level]('serviceWorker', `Service Worker ${state}`, details);
  }

  logPushSubscribe(result: 'subscribed' | 'failed' | 'unsubscribed', details?: Record<string, any>, error?: Error) {
    const level = result === 'subscribed' ? 'success' : result === 'failed' ? 'error' : 'info';
    this[level]('push', `推送订阅 ${result}`, details, error);
  }

  logApiRequest(endpoint: string, method: string, data?: any) {
    this.info('api', `API 请求: ${method} ${endpoint}`, { endpoint, method, data });
  }

  logApiResponse(endpoint: string, status: number, data?: any) {
    const level = status >= 200 && status < 300 ? 'success' : 'error';
    this[level]('api', `API 响应: ${endpoint}`, { endpoint, status, data });
  }

  logNetworkError(endpoint: string, error: Error) {
    this.error('network', `网络请求失败: ${endpoint}`, { endpoint }, error);
  }

  getLogs(category?: LogEntry['category'], level?: LogEntry['level']): LogEntry[] {
    let filtered = [...this.logs];
    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    return filtered.reverse(); // Most recent first
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
    this.notifyListeners();
  }

  exportLogs(): string {
    const exportData = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      logs: this.logs,
      exportTime: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Convenience method to wrap async operations with logging
  async logAsyncOperation<T>(
    category: LogEntry['category'],
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.info(category, `${operationName} 开始`);
    try {
      const result = await operation();
      this.success(category, `${operationName} 完成`, { result: typeof result === 'object' ? JSON.stringify(result, null, 2) : result });
      return result;
    } catch (error) {
      this.error(category, `${operationName} 失败`, undefined, error as Error);
      throw error;
    }
  }
}

export const debugService = new DebugService();
