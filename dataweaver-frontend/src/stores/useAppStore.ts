import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // User
  user: { id: string; name: string; email: string } | null
  setUser: (user: { id: string; name: string; email: string } | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // User
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null })
        window.location.href = '/login'
      },
    }),
    {
      name: 'dataweaver-storage',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen, user: state.user }),
    }
  )
)
