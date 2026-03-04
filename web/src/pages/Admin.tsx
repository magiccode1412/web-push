import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Users, Trash2, Terminal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface PushRecord {
  id: string
  title: string
  content: string
  imageUrl?: string
  timestamp: number
  targetUserId?: string
}

interface Subscription {
  id: number
  userId: string
  endpoint: string
  createdAt: number
  updatedAt: number
}

type TabType = 'records' | 'subscriptions'

export function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('records')
  const [records, setRecords] = useState<PushRecord[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchRecords()
    fetchSubscriptions()
  }, [navigate])

  async function fetchRecords() {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      setIsLoading(false)
      navigate('/login')
      return
    }

    try {
      const response = await fetch('/api/records/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setRecords(data.records || [])
      }
    } catch {
      console.error('获取推送记录失败')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchSubscriptions() {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    try {
      const response = await fetch('/api/subscribe/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setSubscriptions(data.subscriptions || [])
      }
    } catch {
      console.error('获取订阅列表失败')
    }
  }

  async function handleDeleteSubscription(id: number) {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(`/api/subscribe/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        await fetchSubscriptions()
      }
    } catch {
      console.error('删除订阅失败')
    }
  }

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records
    const query = searchQuery.toLowerCase()
    return records.filter(
      record => record.title.toLowerCase().includes(query) ||
                record.content.toLowerCase().includes(query)
    )
  }, [records, searchQuery])

  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery) return subscriptions
    const query = searchQuery.toLowerCase()
    return subscriptions.filter(
      sub => sub.userId.toLowerCase().includes(query) ||
              sub.endpoint.toLowerCase().includes(query)
    )
  }, [subscriptions, searchQuery])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const formatGroupDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatFullDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: PushRecord[] } = {}
    filteredRecords.forEach(record => {
      const dateKey = formatGroupDate(record.timestamp)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(record)
    })
    return groups
  }, [filteredRecords])

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
          <Terminal size={18} className="text-neon-cyan" />
          ADMIN_PANEL
        </h1>
        <div className="w-10" />
      </nav>

      {/* 选项卡切换 */}
      <div className="mx-4 mt-4 mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-sm transition-all ${
            activeTab === 'records'
              ? 'bg-neon-cyan text-background shadow-neon-cyan'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          RECORDS
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-sm transition-all ${
            activeTab === 'subscriptions'
              ? 'bg-neon-cyan text-background shadow-neon-cyan'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          USERS
        </button>
      </div>

      {/* 搜索框 */}
      <div className="mx-4 mb-4">
        <div className="glow-card rounded-lg p-3 flex items-center gap-3">
          {activeTab === 'records' ? <Bell size={16} className="text-neon-cyan" /> : <Users size={16} className="text-neon-purple" />}
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'records' ? '搜索记录...' : '搜索用户...'}
            className="bg-transparent border-none outline-none text-foreground flex-1 font-mono text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="bg-card/30 backdrop-blur-sm border-t border-border p-4 min-h-[calc(100vh-220px)] mx-4 rounded-t-lg">
        {activeTab === 'records' ? (
          isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-card/50 rounded-lg animate-pulse border border-border" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-neon-cyan text-3xl font-mono mb-2">[ ]</div>
              <p className="text-muted-foreground font-mono text-sm">// 暂无推送记录</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {Object.entries(groupedRecords).map(([date, records]) => (
                <div key={date}>
                  <div className="text-xs font-mono text-neon-cyan mb-2 px-1">
                    <span className="text-muted-foreground mr-2">//</span>
                    {date}
                  </div>
                  <div className="flex flex-col gap-2">
                    {records.map((record) => (
                      <Card key={record.id} className="glow-card rounded-lg h-26 overflow-hidden group">
                        <div className="flex gap-3 h-full">
                          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                            <h3 className="text-sm font-semibold text-foreground m-0 font-mono line-clamp-1">
                              <span className="text-neon-cyan mr-1">&gt;</span>
                              {record.title}
                            </h3>
                            <p className="m-0 text-muted-foreground text-xs font-mono line-clamp-2">{record.content}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground font-mono">{formatTime(record.timestamp)}</div>
                              {record.targetUserId ? (
                                <Badge className="bg-neon-purple/10 text-neon-purple border border-neon-purple/30 font-mono text-[10px]">
                                  @{record.targetUserId.slice(0, 10)}...
                                </Badge>
                              ) : (
                                <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/30 font-mono text-[10px]">
                                  BROADCAST
                                </Badge>
                              )}
                            </div>
                          </div>
                          {record.imageUrl && (
                            <div className="w-24 flex-shrink-0 border-l border-border">
                              <img src={record.imageUrl} alt={record.title} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-card/50 rounded-lg animate-pulse border border-border" />
              ))}
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-neon-purple text-3xl font-mono mb-2">[ ]</div>
              <p className="text-muted-foreground font-mono text-sm">// 暂无订阅用户</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSubscriptions.map((subscription) => (
                <Card key={subscription.id} className="glow-card rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 font-mono text-xs">
                          {subscription.userId}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mb-1">ENDPOINT</div>
                      <div className="text-xs text-muted-foreground font-mono bg-card/50 rounded px-2 py-1.5 mb-2 break-all border border-border">
                        {subscription.endpoint.substring(0, 50)}...
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        CREATED: {formatFullDateTime(subscription.createdAt)}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex-shrink-0 w-9 h-9 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center transition-all">
                          <Trash2 size={16} />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border border-border rounded-lg">
                        <DialogHeader>
                          <DialogTitle className="text-base font-semibold text-foreground font-mono">CONFIRM_DELETE</DialogTitle>
                          <DialogDescription className="text-xs text-muted-foreground font-mono">
                            确定要删除用户 <span className="text-neon-cyan">{subscription.userId}</span> 的订阅吗？
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2">
                          <Button className="flex-1 bg-transparent border border-border text-muted-foreground font-mono text-sm hover:bg-card">CANCEL</Button>
                          <Button onClick={() => handleDeleteSubscription(subscription.id)} className="flex-1 bg-destructive text-white font-mono text-sm hover:opacity-90">DELETE</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
