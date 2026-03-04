import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Terminal, Lock, ArrowLeft } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      setErrorMessage('请输入密码')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await authService.login(password)
      if (result.success) {
        navigate('/')
      } else {
        setErrorMessage(result.error || '登录失败')
      }
    } catch {
      setErrorMessage('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-5 pt-[max(20px,env(safe-area-inset-top))] box-border">
      <div className="mb-8">
        <button
          className="text-neon-cyan font-mono text-sm flex items-center gap-1 cursor-pointer hover:text-neon-green transition-colors"
          onClick={goBack}
        >
          <ArrowLeft size={16} />
          <span className="text-muted-foreground mr-1">&lt;-</span> BACK
        </button>
      </div>

      <Card className="glow-card rounded-lg p-8 px-6 flex flex-col flex-1 max-w-[400px] w-full mx-auto">
        <CardHeader className="text-center mb-8 p-0">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <Terminal size={32} className="text-neon-cyan" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground m-0 mb-2 font-mono">
            <span className="text-neon-cyan">MAGIC</span>_PUSH
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground m-0 font-mono">
            // ADMIN_LOGIN
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin} className="flex-1">
          <div className="mb-5">
            <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground mb-2 font-mono">
              <Lock size={12} className="inline mr-1" />
              PASSWORD
            </label>
            <Input
              id="password"
              type="password"
              placeholder="请输入管理员密码..."
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 border border-border rounded-lg text-sm font-mono bg-background focus:border-neon-cyan outline-none transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-xs font-mono mb-5 text-center">
              <span className="text-muted-foreground mr-1">//</span> {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 border border-neon-cyan bg-transparent text-neon-cyan rounded-lg text-sm font-mono cursor-pointer transition-all hover:bg-neon-cyan hover:text-background hover:shadow-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>
                <span className="text-muted-foreground mr-2">AUTHENTICATING</span>
                <span className="animate-pulse">...</span>
              </span>
            ) : (
              <span>&gt; LOGIN</span>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="m-0 text-[10px] text-muted-foreground font-mono">
            // 输入管理员密码以访问管理后台
          </p>
        </div>
      </Card>
    </div>
  )
}
