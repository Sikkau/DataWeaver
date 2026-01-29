import { useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { useChatStore } from '@/stores/useChatStore'
import { useI18n } from '@/i18n/I18nContext'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessageListProps {
  className?: string
}

export function ChatMessageList({ className }: ChatMessageListProps) {
  const { t } = useI18n()
  const messages = useChatStore((state) => state.messages)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <MessageSquare className="h-12 w-12" />
          <p className="text-center text-sm">
            {t.chat?.emptyState || 'Start a conversation'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-y-auto', className)}
    >
      <div className="flex flex-col pb-2">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}
