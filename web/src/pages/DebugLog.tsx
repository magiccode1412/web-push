import React, { useState, useEffect } from 'react';
import { debugService, LogEntry } from '../services/debugService';
import { Terminal, RefreshCw, Trash2, Download, Copy, Cpu, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export default function DebugLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setLogs(debugService.getLogs());
    const unsubscribe = debugService.subscribe(setLogs);
    return () => unsubscribe();
  }, [filterCategory, filterLevel]);

  const filteredLogs = logs.filter(log => {
    if (filterCategory !== 'all' && log.category !== filterCategory) return false;
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    return true;
  });

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-destructive';
      case 'warning': return 'text-amber-500';
      case 'success': return 'text-neon-green';
      case 'info': return 'text-neon-cyan';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '✕';
      case 'warning': return '!';
      case 'success': return '✓';
      case 'info': return 'i';
    }
  };

  const getCategoryColor = (category: LogEntry['category']) => {
    switch (category) {
      case 'push': return 'bg-neon-purple/10 text-neon-purple border-neon-purple/30';
      case 'permission': return 'bg-neon-blue/10 text-neon-blue border-neon-blue/30';
      case 'serviceWorker': return 'bg-neon-green/10 text-neon-green border-neon-green/30';
      case 'api': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'network': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'general': return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleExportLogs = () => {
    const exportData = debugService.exportLogs();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleCopyLogs = () => {
    const exportData = debugService.exportLogs();
    navigator.clipboard.writeText(exportData).then(() => {
      alert('日志已复制到剪贴板');
      setShowExportModal(false);
    });
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="min-h-screen max-w-[800px] mx-auto">
      {/* Header */}
      <header className="p-5 pt-[max(20px,env(safe-area-inset-top))] border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-lg bg-card border border-neon-cyan/30 flex items-center justify-center text-neon-cyan cursor-pointer hover:border-neon-cyan hover:shadow-neon-cyan transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-foreground m-0 text-base font-bold font-mono flex items-center gap-2">
            <Terminal size={18} className="text-neon-cyan" />
            DEBUG_LOG
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 pb-24">
        {/* Actions */}
        <Card className="glow-card rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Category Filter */}
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[10px] text-muted-foreground mb-1 font-mono">CATEGORY</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:border-neon-cyan outline-none"
              >
                <option value="all">ALL</option>
                <option value="push">PUSH</option>
                <option value="permission">PERMISSION</option>
                <option value="serviceWorker">SW</option>
                <option value="api">API</option>
                <option value="network">NETWORK</option>
                <option value="general">GENERAL</option>
              </select>
            </div>

            {/* Level Filter */}
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[10px] text-muted-foreground mb-1 font-mono">LEVEL</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:border-neon-cyan outline-none"
              >
                <option value="all">ALL</option>
                <option value="error">ERROR</option>
                <option value="warning">WARN</option>
                <option value="success">SUCCESS</option>
                <option value="info">INFO</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLogs(debugService.getLogs())}
              className="px-3 py-1.5 bg-transparent border border-neon-cyan text-neon-cyan rounded-lg text-xs font-mono hover:bg-neon-cyan hover:text-background transition-all flex items-center gap-1"
            >
              <RefreshCw size={12} />
              REFRESH
            </button>
            <button
              onClick={() => debugService.clearLogs()}
              className="px-3 py-1.5 bg-transparent border border-destructive text-destructive rounded-lg text-xs font-mono hover:bg-destructive hover:text-white transition-all flex items-center gap-1"
            >
              <Trash2 size={12} />
              CLEAR
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-1.5 bg-transparent border border-neon-green text-neon-green rounded-lg text-xs font-mono hover:bg-neon-green hover:text-background transition-all flex items-center gap-1"
            >
              <Download size={12} />
              EXPORT
            </button>
            <button
              onClick={() => {
                const capabilities = {
                  'Service Worker': 'serviceWorker' in navigator,
                  'Push API': 'PushManager' in window,
                  'Notifications': 'Notification' in window,
                  'HTTPS': window.location.protocol === 'https:',
                  'User Agent': navigator.userAgent
                };
                debugService.logBrowserCapabilities(capabilities);
                setLogs(debugService.getLogs());
              }}
              className="px-3 py-1.5 bg-transparent border border-neon-purple text-neon-purple rounded-lg text-xs font-mono hover:bg-neon-purple hover:text-white transition-all flex items-center gap-1"
            >
              <Cpu size={12} />
              DETECT
            </button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="glow-card rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-neon-cyan font-mono">{logs.length}</div>
            <div className="text-[10px] text-muted-foreground font-mono">TOTAL</div>
          </div>
          <div className="glow-card rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-destructive font-mono">
              {logs.filter(l => l.level === 'error').length}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">ERROR</div>
          </div>
          <div className="glow-card rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-500 font-mono">
              {logs.filter(l => l.level === 'warning').length}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">WARN</div>
          </div>
          <div className="glow-card rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-neon-green font-mono">
              {logs.filter(l => l.level === 'success').length}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">SUCCESS</div>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="glow-card rounded-lg max-w-sm w-full p-5">
              <h3 className="text-base font-bold mb-4 font-mono text-foreground flex items-center gap-2">
                <Terminal size={16} className="text-neon-cyan" />
                EXPORT_LOG
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleExportLogs}
                  className="w-full px-4 py-2.5 bg-transparent border border-neon-cyan text-neon-cyan rounded-lg font-mono text-sm hover:bg-neon-cyan hover:text-background transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  DOWNLOAD_JSON
                </button>
                <button
                  onClick={handleCopyLogs}
                  className="w-full px-4 py-2.5 bg-transparent border border-neon-green text-neon-green rounded-lg font-mono text-sm hover:bg-neon-green hover:text-background transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={14} />
                  COPY_CLIPBOARD
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full px-4 py-2.5 bg-transparent border border-border text-muted-foreground rounded-lg font-mono text-sm hover:bg-card transition-all"
                >
                  CANCEL
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Logs List */}
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="glow-card rounded-lg p-8 text-center">
              <div className="text-neon-cyan text-3xl font-mono mb-2">[ ]</div>
              <p className="text-muted-foreground font-mono text-sm">// 暂无日志记录</p>
              <p className="text-muted-foreground/60 font-mono text-xs mt-2">点击 DETECT 开始记录</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="glow-card rounded-lg overflow-hidden"
              >
                {/* Log Header */}
                <div
                  className="p-3 cursor-pointer hover:bg-card/80 transition"
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Level Icon */}
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-mono font-bold ${getLevelColor(log.level)} ${
                      log.level === 'error' ? 'bg-destructive/10' : 
                      log.level === 'warning' ? 'bg-amber-500/10' : 
                      log.level === 'success' ? 'bg-neon-green/10' : 'bg-neon-cyan/10'
                    }`}>
                      {getLevelIcon(log.level)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Category Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getCategoryColor(log.category)}`}>
                          {log.category.toUpperCase()}
                        </span>
                        {/* Timestamp */}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className={`text-xs font-mono ${getLevelColor(log.level)}`}>
                        <span className="text-muted-foreground mr-1">&gt;</span>
                        {log.message}
                      </p>
                    </div>

                    {/* Expand Icon */}
                    <span className="text-muted-foreground text-xs font-mono">
                      {expandedLogId === log.id ? '▽' : '▷'}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLogId === log.id && (
                  <div className="border-t border-border bg-card/50 p-3">
                    {/* Details */}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] text-muted-foreground mb-2 font-mono">// DETAILS</div>
                        <pre className="bg-background p-2 rounded border border-border overflow-x-auto text-[10px] font-mono text-foreground">
                          {formatJson(log.details)}
                        </pre>
                      </div>
                    )}

                    {/* Error Stack */}
                    {log.error && (
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-2 font-mono">// ERROR_STACK</div>
                        <div className="bg-destructive/5 p-2 rounded border border-destructive/30">
                          <div className="font-mono text-destructive text-[10px]">
                            <div className="font-bold">{log.error.name}: {log.error.message}</div>
                            {log.error.stack && (
                              <pre className="mt-2 whitespace-pre-wrap opacity-80">{log.error.stack}</pre>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground font-mono">
                      ID: {log.id}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
