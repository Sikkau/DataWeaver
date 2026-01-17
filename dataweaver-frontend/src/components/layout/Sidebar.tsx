import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import { useI18n } from '@/i18n/I18nContext'
import {
  Database,
  Search,
  PlayCircle,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const { t } = useI18n()

  const navItems = [
    { icon: Home, label: t.nav.dashboard, path: '/' },
    { icon: Database, label: t.nav.dataSources, path: '/datasources' },
    { icon: Search, label: t.nav.queries, path: '/queries' },
    { icon: PlayCircle, label: t.nav.jobs, path: '/jobs' },
    { icon: Settings, label: t.nav.settings, path: '/settings' },
  ]

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {sidebarOpen && (
          <span className="text-xl font-bold text-primary">DataWeaver</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(!sidebarOpen && 'mx-auto')}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>
      </div>

      <nav className="space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                !sidebarOpen && 'justify-center px-2'
              )}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
