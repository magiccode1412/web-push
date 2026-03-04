import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Share2, Clock, CheckCircle2, Terminal } from 'lucide-react'
import { marked } from 'marked'
import { Card } from '@/components/ui/card'
import { dbService } from '@/services/dbService'
import type { Message, ContentType } from '@/types'

export function Detail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [message, setMessage] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showShareToast, setShowShareToast] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    fetchMessageDetail()
  }, [id])

  // 获取图片 URL：优先 message.imageUrl，其次 localStorage，都没有则为空字符串
  const getImageUrl = () => {
    if (message?.imageUrl) {
      return message.imageUrl
    }
    return localStorage.getItem('background_image') || ''
  }

  const fetchMessageDetail = async () => {
    if (!id) return

    setIsLoading(true)
    try {
      const message = await dbService.getMessage(id)
      setMessage(message || null)
    } catch (error) {
      console.error('加载消息失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    navigate(-1)
  }

  const shareContent = async () => {
    if (navigator.share && message) {
      try {
        await navigator.share({
          title: message.title,
          text: message.content,
          url: window.location.href
        })
      } catch (err) {
        // 用户取消分享，不做处理
      }
    } else {
      // 备用分享方案 - 使用 Toast 提示
      try {
        await navigator.clipboard.writeText(window.location.href)
        setShowShareToast(true)
        setTimeout(() => {
          setShowShareToast(false)
        }, 2000)
      } catch (err) {
        console.error('复制失败:', err)
      }
    }
  }

  const markAsRead = async () => {
    if (message && !message.read) {
      try {
        await dbService.markAsRead(message.id)
        setMessage({ ...message, read: true })
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    }
  }

  useEffect(() => {
    if (message && !message.read) {
      markAsRead()
    }
  }, [message])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'UNKNOWN'

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // 根据 type 渲染内容
  const renderedContent = useMemo(() => {
    if (!message) return ''
    
    const contentType: ContentType = message.type || 'text'
    
    switch (contentType) {
      case 'markdown':
        return marked.parse(message.content, { breaks: true, gfm: true }) as string
      case 'html':
        return message.content
      case 'text':
      default:
        return null // 纯文本直接渲染
    }
  }, [message])

  // 获取内容类型标签
  const getContentTypeLabel = () => {
    const contentType = message?.type || 'text'
    const labels = {
      text: 'TEXT',
      markdown: 'MARKDOWN',
      html: 'HTML'
    }
    return labels[contentType] || 'TEXT'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neon-cyan font-mono text-sm">LOADING...</p>
        </div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-neon-cyan text-5xl mb-4 font-mono">[404]</div>
          <p className="text-muted-foreground font-mono">// 消息不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-center p-4 pt-[max(16px,env(safe-area-inset-top))] px-5">
        <button 
          className="w-10 h-10 rounded-lg bg-card border border-neon-cyan/30 flex items-center justify-center text-neon-cyan cursor-pointer transition-all duration-300 hover:border-neon-cyan hover:shadow-neon-cyan active:scale-95"
          onClick={goBack}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex gap-2">
          <button 
            className="w-10 h-10 rounded-lg bg-card border border-neon-cyan/30 flex items-center justify-center text-neon-cyan cursor-pointer transition-all duration-300 hover:border-neon-cyan hover:shadow-neon-cyan active:scale-95"
            onClick={shareContent}
          >
            <Share2 size={18} />
          </button>
        </div>
      </nav>

      {/* 头图区域 */}
      {getImageUrl() && (
        <div className="relative h-[350px] overflow-hidden">
          <div className="w-full h-full bg-card">
            {!imageError ? (
              <img
                src={getImageUrl()}
                alt={message.title}
                onError={handleImageError}
                className="w-full h-full object-cover opacity-70"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-card via-background to-card relative overflow-hidden">
                {/* 网格背景 */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
                {/* 中心装饰 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-lg border border-neon-cyan/30 flex items-center justify-center bg-neon-cyan/5">
                      <Terminal size={32} className="text-neon-cyan/50" />
                    </div>
                    <p className="text-neon-cyan/40 font-mono text-xs">NO_IMAGE</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute top-20 left-5 text-neon-cyan font-mono text-xs opacity-60">
            <Terminal size={14} className="inline mr-1" />
            IMAGE_DATA
          </div>
        </div>
      )}

      {/* 文章内容 */}
      <div className={`px-4 max-w-[800px] mx-auto ${getImageUrl() ? 'relative -mt-[100px]' : 'pt-20'}`}>
        <Card className="glow-card rounded-lg p-5 mb-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-xl font-bold text-foreground m-0 leading-tight flex-1 font-mono break-words">
                <span className="text-neon-cyan mr-2">&gt;</span>
                {message.title}
              </h1>
              {message.read && (
                <CheckCircle2 size={18} className="text-neon-green flex-shrink-0" />
              )}
            </div>

            <div className="flex flex-wrap gap-4 items-center pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <Clock size={14} className="text-neon-cyan/50" />
                <span>{formatDate(message.timestamp)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 分隔线 */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-mono">{getContentTypeLabel()}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 正文内容 */}
        <Card className="glow-card rounded-lg p-5 mb-8">
          {renderedContent ? (
            <div 
              className="prose prose-sm prose-invert max-w-none text-muted-foreground break-words content-render"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          ) : (
            <p className="leading-relaxed text-muted-foreground text-sm font-mono whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </Card>
      </div>

      {/* 分享提示 Toast */}
      {showShareToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-neon-cyan text-neon-cyan px-6 py-4 rounded-lg text-sm font-mono z-[1000] whitespace-nowrap shadow-neon-cyon animate-fadeInOut">
          <span className="text-neon-cyan mr-2">&gt;</span>
          链接已复制到剪贴板
        </div>
      )}
    </div>
  )
}
