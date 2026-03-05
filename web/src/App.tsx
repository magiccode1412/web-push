import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Home } from './pages/Home'
import { Admin } from './pages/Admin'
import { Login } from './pages/Login'
import { Settings } from './pages/Settings'
import { Push } from './pages/Push'
import { Detail } from './pages/Detail'
import DebugLog from './pages/DebugLog'
import { BottomNav } from './components/BottomNav'
import { BackgroundImage } from './components/BackgroundImage'

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const showBottomNav = ['/', '/admin', '/settings'].includes(location.pathname)
  const showBackgroundImage = !location.pathname.startsWith('/detail')

  useEffect(() => {
    // 处理 Service Worker 发送的导航消息
    const handleSWMessage = (event: MessageEvent) => {
      console.log('[App] 收到 Service Worker 消息:', event.data)
      if (event.data.type === 'NAVIGATE' && event.data.url) {
        console.log('[App] 导航到:', event.data.url)
        navigate(event.data.url)
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
    }
  }, [navigate])

  useEffect(() => {
    // 使用事件委托拦截所有 a 元素的点击事件
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // 向上查找最近的 a 元素
      const anchor = target.closest('a')
      
      if (anchor) {
        const href = anchor.getAttribute('href')
        // 只处理有有效 href 且不是锚点链接的情况
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          event.preventDefault()
          window.open(href, '_blank')
        }
      }
    }

    document.addEventListener('click', handleClick)
    
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <>
      {showBackgroundImage && <BackgroundImage imageUrl={import.meta.env.VITE_BG_URL} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/push" element={<Push />} />
        <Route path="/debug-log" element={<DebugLog />} />
        <Route path="/detail/:id" element={<Detail />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
    </BrowserRouter>
  )
}

export default App
