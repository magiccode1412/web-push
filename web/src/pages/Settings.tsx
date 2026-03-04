import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Trash2, ChevronRight, RefreshCw, Send, Image, ImageOff, Bug, Terminal, Database, Settings as SettingsIcon, Info } from 'lucide-react'
import { pushService } from '@/services/pushService'
import { dbService } from '@/services/dbService'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function Settings() {
  const navigate = useNavigate()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const [userId, setUserId] = useState('')
  const [showUserIdDialog, setShowUserIdDialog] = useState(false)
  const [userIdInput, setUserIdInput] = useState('')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [showBgImageDialog, setShowBgImageDialog] = useState(false)
  const [bgImageInput, setBgImageInput] = useState('')
  const [buildDate, setBuildDate] = useState('加载中...')

  const isInitialized = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    loadUserId()
    loadBackgroundImage()
    checkPushSubscription()
    loadBuildDate()
  }, [])

  function loadUserId() {
    setUserId(localStorage.getItem('push_user_id') || '')
  }

  function loadBackgroundImage() {
    setBackgroundImage(localStorage.getItem('background_image') || '')
  }

  function loadBuildDate() {
    try {
      const buildTimestamp = import.meta.env.VITE_BUILD_TIME
      if (buildTimestamp) {
        const date = new Date(parseInt(buildTimestamp))
        setBuildDate(date.toLocaleDateString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit'
        }) + ' ' + date.toLocaleTimeString('zh-CN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }))
      } else {
        const now = new Date()
        setBuildDate(now.toLocaleDateString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit'
        }) + ' ' + now.toLocaleTimeString('zh-CN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }))
      }
    } catch {
      const now = new Date()
      setBuildDate(now.toLocaleDateString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      }) + ' ' + now.toLocaleTimeString('zh-CN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }))
    }
  }

  function openUserIdDialog() {
    setUserIdInput(userId)
    setShowUserIdDialog(true)
  }

  function openBgImageDialog() {
    setBgImageInput(backgroundImage)
    setShowBgImageDialog(true)
  }

  function saveUserId() {
    if (!userIdInput.trim()) {
      showToastMessage('userId 不能为空', 'error')
      return
    }
    setUserId(userIdInput)
    localStorage.setItem('push_user_id', userIdInput)
    setShowUserIdDialog(false)
    showToastMessage('userId 已更新', 'success')
  }

  function saveBackgroundImage() {
    if (!bgImageInput.trim()) {
      setBackgroundImage('')
      localStorage.removeItem('background_image')
      document.body.style.backgroundImage = 'none'
    } else {
      try {
        new URL(bgImageInput.trim())
        setBackgroundImage(bgImageInput.trim())
        localStorage.setItem('background_image', bgImageInput.trim())
        showToastMessage('背景图已更新', 'success')
      } catch {
        showToastMessage('请输入有效的图片 URL', 'error')
        return
      }
    }
    setShowBgImageDialog(false)
  }

  function clearBackgroundImage() {
    setBackgroundImage('')
    localStorage.removeItem('background_image')
    document.body.style.backgroundImage = 'none'
    showToastMessage('已关闭背景图', 'success')
  }

  async function randomGenerateUserId() {
    const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
    setUserId(newUserId)
    localStorage.setItem('push_user_id', newUserId)

    if (pushEnabled) {
      try {
        setLoading(true)
        await pushService.unsubscribe()
        const result = await pushService.subscribe()
        if (result) {
          showToastMessage('userId 已更新，推送订阅已重新激活', 'success')
        } else {
          showToastMessage('userId 更新成功，但推送订阅失败', 'error')
        }
      } catch {
        showToastMessage('userId 已更新，请手动重新订阅推送', 'error')
      } finally {
        setLoading(false)
      }
    } else {
      showToastMessage('userId 已更新', 'success')
    }
  }

  async function checkPushSubscription() {
    if (!('serviceWorker' in navigator)) {
      setPushEnabled(false)
      return
    }
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setPushEnabled(!!subscription)
    } catch {
      setPushEnabled(false)
    }
  }

  async function togglePushSubscription() {
    setLoading(true)
    try {
      if (pushEnabled) {
        await pushService.unsubscribe()
        setPushEnabled(false)
        showToastMessage('已关闭消息推送', 'success')
      } else {
        const permission = await pushService.requestPermission()
        if (permission !== 'granted') {
          showToastMessage('请允许推送通知权限', 'error')
          return
        }
        const result = await pushService.subscribe()
        if (result) {
          setPushEnabled(true)
          showToastMessage('已开启消息推送', 'success')
        } else {
          showToastMessage('订阅推送失败', 'error')
        }
      }
    } catch {
      showToastMessage('操作失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function clearLocalStorage() {
    if (!confirm('确定要清空所有本地存储的数据吗？此操作不可恢复。')) return
    try {
      setLoading(true)
      await dbService.clearAllMessages()
      showToastMessage('已清空本地存储', 'success')
    } catch {
      showToastMessage('清空失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  function showToastMessage(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2000)
  }

  function goHome() {
    navigate('/')
  }

  return (
    <div className="min-h-screen max-w-[800px] mx-auto">
      {/* 顶部标题栏 */}
      <header className="p-5 pt-[max(20px,env(safe-area-inset-top))] flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm">
        <button
          className="text-neon-cyan font-mono text-sm flex items-center gap-1 cursor-pointer hover:text-neon-green transition-colors"
          onClick={goHome}
        >
          <span className="text-muted-foreground">&lt;-</span> BACK
        </button>
        <h1 className="text-foreground text-lg font-bold m-0 font-mono flex items-center gap-2">
          <SettingsIcon size={18} className="text-neon-cyan" />
          SETTINGS
        </h1>
        <div className="w-[60px]" />
      </header>

      {/* 设置列表 */}
      <div className="p-4">
        {/* 用户设置 */}
        <Card className="glow-card rounded-lg mb-4 overflow-hidden">
          <div className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-card/80 active:bg-card/60" onClick={openUserIdDialog}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neon-cyan/10 border border-neon-cyan/30">
                <RefreshCw size={18} className="text-neon-cyan" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground font-mono">USER_ID</span>
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                  {userId || 'NULL'}
                </span>
              </div>
            </div>
            <Button
              className="px-3 py-1.5 bg-transparent border border-neon-cyan text-neon-cyan text-xs font-mono cursor-pointer hover:bg-neon-cyan hover:text-background transition-all"
              onClick={(e) => { e.stopPropagation(); randomGenerateUserId(); }}
            >
              RANDOM
            </Button>
          </div>
        </Card>

        {/* 推送通知设置 */}
        <Card className="glow-card rounded-lg mb-4 overflow-hidden">
          <div className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-card/80" onClick={togglePushSubscription}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neon-purple/10 border border-neon-purple/30">
                <Bell size={18} className="text-neon-purple" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground font-mono">PUSH_NOTIFY</span>
                <span className="text-xs text-muted-foreground font-mono">{pushEnabled ? 'ENABLED' : 'DISABLED'}</span>
              </div>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={togglePushSubscription} disabled={loading} />
          </div>

          <div className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-card/80 border-t border-border" onClick={() => navigate('/push')}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neon-green/10 border border-neon-green/30">
                <Send size={18} className="text-neon-green" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground font-mono">PUSH_TEST</span>
                <span className="text-xs text-muted-foreground font-mono">// 发送测试推送</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-card/80 border-t border-border" onClick={() => navigate('/debug-log')}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
                <Bug size={18} className="text-amber-500" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground font-mono">DEBUG_LOG</span>
                <span className="text-xs text-muted-foreground font-mono">// 查看运行日志</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
        </Card>

        {/* 背景图设置 */}
        <Card className="glow-card rounded-lg mb-4 overflow-hidden">
          <div className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-card/80" onClick={openBgImageDialog}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neon-pink/10 border border-neon-pink/30">
                <Image size={18} className="text-neon-pink" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground font-mono">BG_IMAGE</span>
                <span className="text-xs text-muted-foreground font-mono">{backgroundImage ? 'SET' : 'NULL'}</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>

          {backgroundImage && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/10 border border-destructive/30">
                  <ImageOff size={18} className="text-destructive" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground font-mono">CLEAR_BG</span>
                  <span className="text-xs text-muted-foreground font-mono">// 移除背景图</span>
                </div>
              </div>
              <Button
                className="px-3 py-1.5 bg-transparent border border-destructive text-destructive text-xs font-mono cursor-pointer hover:bg-destructive hover:text-white transition-all"
                onClick={clearBackgroundImage}
                disabled={loading}
              >
                REMOVE
              </Button>
            </div>
          )}
        </Card>

        {/* 数据管理 */}
        <Card className="glow-card rounded-lg mb-4 overflow-hidden">
          <div className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-card/80" onClick={clearLocalStorage}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/10 border border-destructive/30">
                <Database size={18} className="text-destructive" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground font-mono">CLEAR_DATA</span>
                <span className="text-xs text-muted-foreground font-mono">// 清空本地存储</span>
              </div>
            </div>
            <Trash2 size={18} className="text-destructive" />
          </div>
        </Card>

        {/* 应用信息 */}
        <Card className="glow-card rounded-lg mb-4 overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-neon-cyan" />
              <span className="text-xs text-muted-foreground font-mono">SYSTEM_INFO</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border">
              <span className="text-xs text-muted-foreground font-mono">BUILD_DATE</span>
              <span className="text-xs text-foreground font-mono">{buildDate}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Toast 提示 */}
      {toast.show && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-sm font-mono z-[1000] whitespace-nowrap border ${
          toast.type === 'success' 
            ? 'bg-card border-neon-cyan text-neon-cyan shadow-neon-cyan' 
            : 'bg-card border-destructive text-destructive'
        }`}>
          <span className="text-muted-foreground mr-2">&gt;</span>
          {toast.message}
        </div>
      )}

      {/* userId 设置对话框 */}
      <Dialog open={showUserIdDialog} onOpenChange={setShowUserIdDialog}>
        <DialogContent className="bg-card border border-border rounded-lg w-[90%] max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground font-mono flex items-center gap-2">
              <Terminal size={16} className="text-neon-cyan" />
              SET_USER_ID
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-0">
            <p className="text-xs text-muted-foreground mb-4 font-mono">// 用户ID用于标识身份，接收推送消息</p>
            <Input
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              type="text"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-mono bg-background focus:border-neon-cyan outline-none transition-colors"
              placeholder="输入用户ID..."
              maxLength={50}
            />
          </div>
          <DialogFooter className="flex gap-3 px-4 pb-4">
            <Button
              className="flex-1 py-2.5 bg-transparent border border-border rounded-lg text-sm font-mono cursor-pointer hover:bg-card transition-colors text-muted-foreground"
              onClick={() => setShowUserIdDialog(false)}
            >
              CANCEL
            </Button>
            <Button
              className="flex-1 py-2.5 bg-neon-cyan text-background rounded-lg text-sm font-mono cursor-pointer hover:shadow-neon-cyan transition-all"
              onClick={saveUserId}
            >
              SAVE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 背景图设置对话框 */}
      <Dialog open={showBgImageDialog} onOpenChange={setShowBgImageDialog}>
        <DialogContent className="bg-card border border-border rounded-lg w-[90%] max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground font-mono flex items-center gap-2">
              <Image size={16} className="text-neon-pink" />
              SET_BG_IMAGE
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-0">
            <p className="text-xs text-muted-foreground mb-4 font-mono">// 输入图片URL设置为背景，留空则关闭</p>
            <Input
              value={bgImageInput}
              onChange={(e) => setBgImageInput(e.target.value)}
              type="url"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-mono bg-background focus:border-neon-cyan outline-none transition-colors mb-3"
              placeholder="输入图片URL..."
            />
            {bgImageInput && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={bgImageInput} alt="预览" className="w-full h-[120px] object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-3 px-4 pb-4">
            <Button className="flex-1 py-2.5 bg-transparent border border-border rounded-lg text-sm font-mono cursor-pointer hover:bg-card transition-colors text-muted-foreground" onClick={() => setShowBgImageDialog(false)}>
              CANCEL
            </Button>
            <Button className="flex-1 py-2.5 bg-neon-cyan text-background rounded-lg text-sm font-mono cursor-pointer hover:shadow-neon-cyan transition-all" onClick={saveBackgroundImage}>
              SAVE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
