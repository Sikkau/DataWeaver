import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import { useI18n } from '@/i18n/I18nContext'
import {
  Database,
  Search,
  Wrench,
  Server,
  Settings,
  Home,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const { t } = useI18n()

  const navItems = [
    { icon: Home, label: t.nav.dashboard, path: '/' },
    { icon: Database, label: t.nav.dataSources, path: '/datasources' },
    { icon: Search, label: t.nav.queries, path: '/queries' },
    { icon: Wrench, label: t.nav.tools, path: '/tools' },
    { icon: Server, label: t.nav.mcpServers, path: '/mcp-servers' },
    { icon: MessageCircle, label: t.nav.chat || 'Chat', path: '/chat' },
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
          aria-label={sidebarOpen ? t.common.collapseSidebar : t.common.expandSidebar}
        >
          {sidebarOpen ? <ChevronLeft size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
        </Button>
      </div>

      <TooltipProvider delayDuration={0}>
        <nav className="space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

            const linkContent = (
              <Link
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  !sidebarOpen && 'justify-center px-2',
                  // Active indicator bar
                  isActive && 'relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary-foreground before:opacity-80',
                  !sidebarOpen && isActive && 'before:hidden'
                )}
              >
                <item.icon size={20} className="shrink-0" aria-hidden="true" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )

            // Show tooltip only when sidebar is collapsed
            if (!sidebarOpen) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.path}>{linkContent}</div>
          })}
        </nav>
      </TooltipProvider>
    </aside>
  )
}
