import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const { sidebarOpen, user, setUser } = useAppStore()

  useEffect(() => {
    // Restore user from localStorage if not in store (fallback for old sessions)
    if (!user) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          console.log('Restoring user from localStorage:', userData)
          setUser({
            id: String(userData.id),
            name: userData.username,
            email: userData.email,
          })
        } catch (err) {
          console.error('Failed to parse user data:', err)
        }
      }
    }
  }, [user, setUser])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
