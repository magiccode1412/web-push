import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Loader, Terminal, Key, Type, FileText, Image, User, Code } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { ContentType } from '@/types'

export function Push() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<ContentType>('text')
  const [imageUrl, setImageUrl] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [pushToken, setPushToken] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const savedPushToken = localStorage.getItem('PUSH_TOKEN')
    if (savedPushToken) {
      setPushToken(savedPushToken)
    }
  }, [])

  async function sendPush() {
    if (!pushToken || !title || !content) {
      showMessage('error', '请填写推送 Token、标题和内容')
      return
    }

    setIsSending(true)
    setMessage(null)
    localStorage.setItem('PUSH_TOKEN', pushToken)

    try {
      const body: { title: string; content: string; type: ContentType; imageUrl?: string; targetUserId?: string } = {
        title: title,
        content: content,
        type: contentType
      }

      if (imageUrl.trim()) {
        body.imageUrl = imageUrl.trim()
      }

      if (targetUserId.trim()) {
        body.targetUserId = targetUserId.trim()
      }

      const response = await fetch('/api/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pushToken}`
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        showMessage('success', `推送成功！已发送给 ${result.pushedCount} 个用户`)
        setTitle('')
        setContent('')
        setContentType('text')
        setImageUrl('')
        setTargetUserId('')
      } else {
        showMessage('error', result.message || '推送失败')
      }
    } catch {
      showMessage('error', '推送失败，请检查网络连接')
    } finally {
      setIsSending(false)
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="min-h-screen max-w-[800px] mx-auto">
      <nav className="flex justify-between items-center p-5 pt-[max(20px,env(safe-area-inset-top))] border-b border-border bg-card/50 backdrop-blur-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-lg bg-card border border-neon-cyan/30 flex items-center justify-center text-neon-cyan cursor-pointer hover:border-neon-cyan hover:shadow-neon-cyan transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-foreground m-0 text-base font-bold font-mono flex items-center gap-2">
          <Send size={18} className="text-neon-cyan" />
          SEND_PUSH
        </h1>
        <div className="w-10" />
      </nav>

      <div className="p-4 min-h-[calc(100vh-80px)]">
        {message && (
          <div className={`px-4 py-3 rounded-lg mb-4 text-xs font-mono border ${
            message.type === 'success' 
              ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' 
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}>
            <span className="text-muted-foreground mr-2">{message.type === 'success' ? '>' : '!'}</span>
            {message.text}
          </div>
        )}

        <Card className="glow-card rounded-lg p-5 mb-4">
          {/* Push Token */}
          <div className="mb-5 relative">
            <label className="block text-xs font-semibold text-muted-foreground mb-2 font-mono flex items-center gap-1">
              <Key size={12} className="text-neon-cyan" />
              PUSH_TOKEN <span className="text-destructive">*</span>
            </label>
            <Input
              type="password"
              placeholder="输入推送 Token..."
              value={pushToken}
              onChange={(e) => setPushToken(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-mono bg-background focus:border-neon-cyan outline-none transition-colors placeholder:text-muted-foreground/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5 m-0 font-mono">// 由服务端配置，联系管理员获取</p>
          </div>

          {/* Title */}
          <div className="mb-5 relative">
            <label className="block text-xs font-semibold text-muted-foreground mb-2 font-mono flex items-center gap-1">
              <Type size={12} className="text-neon-cyan" />
              TITLE <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="输入推送标题..."
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-mono bg-background focus:border-neon-cyan outline-none transition-colors placeholder:text-muted-foreground/50"
            />
            <span className="absolute right-3 bottom-2.5 text-[10px] text-muted-foreground font-mono">{title.length}/50</span>
          </div>

          {/* Content Type */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-muted-foreground mb-2 font-mono flex items-center gap-1">
              <Code size={12} className="text-neon-green" />
              CONTENT_TYPE
            </label>
            <div className="flex gap-2">
              {(['text', 'markdown', 'html'] as ContentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContentType(type)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all border ${
                    contentType === type
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                      : 'bg-transparent border-border text-muted-foreground hover:border-neon-cyan/50'
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 m-0 font-mono">
              {contentType === 'text' && '// 纯文本格式'}
              {contentType === 'markdown' && '// 支持 Markdown 语法'}
              {contentType === 'html' && '// 直接渲染 HTML'}
            </p>
          </div>

          {/* Content */}
          <div className="mb-5 relative">
            <label className="block text-xs font-semibold text-muted-foreground mb-2 font-mono flex items-center gap-1">
              <FileText size={12} className="text-neon-cyan" />
              CONTENT <span className="text-destructive">*</span>
            </label>
            <textarea
              placeholder={contentType === 'markdown' ? '# 标题\n**加粗** `代码`' : contentType === 'html' ? '<h1>标题</h1><p>内容</p>' : '输入推送内容...'}
              rows={contentType === 'text' ? 4 : 8}
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-mono bg-background focus:border-neon-cyan outline-none transition-colors placeholder:text-muted-foreground/50 resize-none"
            />
            <span className="absolute right-3 bottom-2.5 text-[10px] text-muted-foreground font-mono">{content.length}/2000</span>
          </div>

          {/* Image URL */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-muted-foreground mb-2 font-mono flex items-center gap-1">
              <Image size={12} className="text-neon-pink" />
              IMAGE_URL <span className="text-muted-foreground/50">(可选)</span>
            </label>
            <Input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-mono bg-background focus:border-neon-cyan outline-none transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Target User ID */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-muted-foreground mb-2 font-mono flex items-center gap-1">
              <User size={12} className="text-neon-purple" />
              TARGET_USER <span className="text-muted-foreground/50">(可选)</span>
            </label>
            <Input
              type="text"
              placeholder="留空则广播给所有用户..."
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-mono bg-background focus:border-neon-cyan outline-none transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          <Button
            onClick={sendPush}
            disabled={isSending || !pushToken || !title || !content}
            className="w-full py-3 border border-neon-cyan bg-transparent text-neon-cyan rounded-lg text-sm font-mono cursor-pointer transition-all hover:bg-neon-cyan hover:text-background hover:shadow-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <Loader size={16} className="animate-spin" />
                SENDING...
              </>
            ) : (
              <>
                <Send size={16} />
                &gt; SEND_PUSH
              </>
            )}
          </Button>
        </Card>

        <Card className="glow-card rounded-lg p-4">
          <h3 className="m-0 mb-3 text-xs text-muted-foreground font-mono flex items-center gap-2">
            <Terminal size={14} className="text-neon-cyan" />
            // USAGE_TIPS
          </h3>
          <ul className="m-0 text-muted-foreground text-xs font-mono space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan">*</span>
              <span>推送 Token 自动保存到本地</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan">*</span>
              <span>留空目标用户ID则广播给所有用户</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan">*</span>
              <span>图片建议尺寸 1:1 或 2:1</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan">*</span>
              <span>Markdown 支持：标题、列表、代码块、链接等</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
