import { ChatPanel } from './ChatPanel'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

export function ChatPage() {
  const { sidebarOpen } = useAppStore()

  return (
    <div
      className={cn(
        'fixed inset-0 pt-16 transition-all duration-300 bg-background',
        sidebarOpen ? 'ml-64' : 'ml-16'
      )}
    >
      <ChatPanel isFullScreen className="h-full" />
    </div>
  )
}
