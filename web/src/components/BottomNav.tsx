import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  path: string
}

const navItems: NavItem[] = [
  { id: 'home', label: 'HOME', path: '/' },
  { id: 'admin', label: 'ADMIN', path: '/admin' },
  { id: 'settings', label: 'CONFIG', path: '/settings' }
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const activePath = location.pathname

  const handleNavClick = (item: NavItem) => {
    navigate(item.path)
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000]">
      <nav className="flex items-center justify-around px-1 py-1 min-w-[180px] rounded-lg bg-card/95 backdrop-blur-xl border border-neon-cyan/30 shadow-glow animate-float">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={cn(
              "flex-1 text-center px-4 py-2 cursor-pointer transition-all duration-300 relative font-mono text-xs tracking-wider",
              activePath === item.path 
                ? "text-neon-cyan" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="transition-all duration-300">
              {activePath === item.path && <span className="mr-1">&gt;</span>}
              {item.label}
            </span>
            {activePath === item.path && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-neon-cyan shadow-neon-cyan transition-all duration-300" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
