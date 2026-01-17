import { Bell, Moon, Sun, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

export function Header() {
  const { theme, setTheme, sidebarOpen, user, logout } = useAppStore()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
    document.documentElement.classList.toggle('dark', theme !== 'dark')
  }

  return (
    <header
      className={cn(
        'fixed top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-16',
        'right-0'
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">DataWeaver</h1>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        <Button variant="ghost" size="icon">
          <Bell size={20} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.name || 'Guest'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
