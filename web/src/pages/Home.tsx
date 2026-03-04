import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Plus, TrendingUp, Terminal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { dbService } from '@/services/dbService'
import type { Message } from '@/types'

export function Home() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const messages = await dbService.getAllMessages()
        setItems(messages)
      } catch (error) {
        console.error('加载消息失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [])

  const goToDetail = (id: string) => {
    navigate(`/detail/${id}`)
  }

  const goToAdmin = () => {
    navigate('/admin')
  }

  // 格式化时间（HH:mm 格式）
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 格式化日期（用于分组标题）
  const formatGroupDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // 按日期分组消息
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: Message[] } = {}

    items.forEach(item => {
      const dateKey = formatGroupDate(item.timestamp)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(item)
    })

    return groups
  }, [items])

  const unreadCount = items.filter(item => !item.read).length

  return (
    <div className="min-h-screen pb-20 max-w-[800px] mx-auto">
      {/* 顶部欢迎区域 */}
      <header className="p-5 pt-[max(20px,env(safe-area-inset-top))]">
        <div className="flex justify-between items-center">
          <div className="text-foreground">
            <h1 className="text-2xl font-bold mb-1 tracking-tight font-mono flex items-center gap-2">
              <Terminal className="w-6 h-6 text-neon-cyan" />
              <span className="text-neon-cyan">HELLO</span>
              <span className="text-muted-foreground">, USER</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono m-0">// 系统就绪，等待接收数据...</p>
          </div>
          <button
            className="w-12 h-12 rounded-lg bg-card border border-neon-cyan/30 text-neon-cyan flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 hover:border-neon-cyan hover:shadow-neon-cyan"
            onClick={goToAdmin}
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-6">
        <Card className="glow-card rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neon-cyan/10 border border-neon-cyan/30">
            <TrendingUp size={18} className="text-neon-cyan" />
          </div>
          <div className="text-foreground">
            <div className="text-xl font-bold leading-none mb-1 font-mono text-neon-cyan">{items.length}</div>
            <div className="text-xs text-muted-foreground font-mono">TOTAL_MSG</div>
          </div>
        </Card>
        <Card className="glow-card rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neon-purple/10 border border-neon-purple/30">
            <Sparkles size={18} className="text-neon-purple" />
          </div>
          <div className="text-foreground">
            <div className="text-xl font-bold leading-none mb-1 font-mono text-neon-purple">{unreadCount}</div>
            <div className="text-xs text-muted-foreground font-mono">UNREAD</div>
          </div>
        </Card>
      </div>

      {/* 内容列表 */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-5 min-h-[calc(100vh-240px)] mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground m-0 font-mono flex items-center gap-2">
            <span className="text-neon-cyan">#</span>
            MESSAGE_LIST
          </h2>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded font-mono border border-border">{items.length}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-secondary/30 rounded-lg animate-pulse border border-border" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neon-cyan text-4xl mb-4 font-mono">[ ]</div>
            <p className="text-muted-foreground font-mono text-sm">// 暂无消息</p>
            <p className="text-muted-foreground/60 font-mono text-xs mt-2">等待推送通知...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.entries(groupedItems).map(([date, messages]) => (
              <div key={date}>
                <div className="text-xs font-mono text-neon-cyan mb-2 px-1 flex items-center gap-2">
                  <span className="text-muted-foreground">//</span>
                  <span>{date}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {messages.map((item) => (
                    <Card
                      key={item.id}
                      className="relative rounded-lg h-26 overflow-hidden transition-all duration-300 cursor-pointer flex hover:border-neon-cyan/50 border border-border bg-card hover:bg-card/80 active:scale-[0.99] group"
                      onClick={() => goToDetail(item.id)}
                    >
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div className="flex items-start gap-2">
                          <h3 className="text-sm font-bold text-foreground m-0 leading-relaxed line-clamp-1 flex-1 font-mono group-hover:text-neon-cyan transition-colors">
                            <span className="text-neon-cyan mr-1">&gt;</span>
                            {item.title}
                          </h3>
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-neon-cyan flex-shrink-0 mt-1 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground m-0 leading-relaxed line-clamp-2 font-mono">{item.content}</p>
                        <div className="text-xs text-muted-foreground/60 font-mono flex items-center gap-1">
                          <span className="text-neon-cyan/50">@</span>
                          {formatTime(item.timestamp)}
                        </div>
                      </div>
                      {item.imageUrl && (
                        <div className="w-24 flex-shrink-0 border-l border-border">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
