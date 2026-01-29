import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ChatMessageList } from './ChatMessageList'
import { ChatInput } from './ChatInput'
import { ChatSuggestions } from './ChatSuggestions'
import { useChatStore } from '@/stores/useChatStore'
import { useModelStore } from '@/stores/useModelStore'
import { useI18n } from '@/i18n/I18nContext'
import { getSuggestionsForPath } from '@/config/chatContexts'
import { sendChatMessage } from '@/api/chat'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trash2, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ChatPanelProps {
  className?: string
  isFullScreen?: boolean
}

export function ChatPanel({ className, isFullScreen = false }: ChatPanelProps) {
  const { t, language } = useI18n()
  const location = useLocation()

  const {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    setMessageStreaming,
    clearMessages,
    setLoading,
    setCurrentStreamingId,
  } = useChatStore()

  const { provider, apiKey, baseUrl, model, isValidated } = useModelStore()

  const suggestions = getSuggestionsForPath(
    location.pathname,
    language as 'en' | 'zh'
  )

  const isModelConfigured = apiKey && model && isValidated

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!isModelConfigured) {
        toast.error(
          t.chat?.configureModel || 'Please configure AI model in Settings'
        )
        return
      }

      // Add user message
      addMessage({ role: 'user', content })

      // Add empty assistant message for streaming
      const assistantId = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      })

      setLoading(true)
      setCurrentStreamingId(assistantId)

      const allMessages = [
        ...messages,
        { id: '', role: 'user' as const, content, timestamp: Date.now() },
      ]

      await sendChatMessage(
        allMessages,
        { provider, apiKey, baseUrl, model },
        {
          onToken: (token) => {
            useChatStore.setState((state) => {
              const msg = state.messages.find((m) => m.id === assistantId)
              if (msg) {
                return {
                  messages: state.messages.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + token }
                      : m
                  ),
                }
              }
              return state
            })
          },
          onComplete: () => {
            setMessageStreaming(assistantId, false)
            setLoading(false)
            setCurrentStreamingId(null)
          },
          onError: (error) => {
            setMessageStreaming(assistantId, false)
            updateMessage(
              assistantId,
              t.chat?.errorMessage || `Error: ${error.message}`
            )
            setLoading(false)
            setCurrentStreamingId(null)
            toast.error(error.message)
          },
        }
      )
    },
    [
      isModelConfigured,
      messages,
      provider,
      apiKey,
      baseUrl,
      model,
      addMessage,
      updateMessage,
      setMessageStreaming,
      setLoading,
      setCurrentStreamingId,
      t,
    ]
  )

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      handleSendMessage(suggestion)
    },
    [handleSendMessage]
  )

  return (
    <div
      className={cn(
        'relative bg-background',
        isFullScreen ? 'h-full' : 'h-[500px]',
        className
      )}
    >
      {/* Header - absolute top */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <h2 className="font-semibold">{t.chat?.title || 'Chat'}</h2>
        <div className="flex items-center gap-2">
          {!isModelConfigured && (
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="gap-1">
                <Settings className="h-4 w-4" />
                <span className="text-xs">
                  {t.chat?.configureModelShort || 'Configure'}
                </span>
              </Button>
            </Link>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              title={t.chat?.clearChat || 'Clear chat'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages - scrollable middle area */}
      <div
        className={cn(
          'absolute left-0 right-0 overflow-hidden',
          // Top offset for header (52px)
          'top-[52px]',
          // Bottom offset: input height (~72px) + suggestions if shown
          messages.length === 0 ? 'bottom-[180px]' : 'bottom-[72px]'
        )}
      >
        <ChatMessageList className="h-full" />
      </div>

      {/* Suggestions - above input, only when no messages */}
      {messages.length === 0 && (
        <div className="absolute left-0 right-0 bottom-[72px] border-t bg-background">
          <ChatSuggestions
            suggestions={suggestions}
            onSelect={handleSelectSuggestion}
          />
        </div>
      )}

      {/* Input - absolute bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-background">
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={!isModelConfigured}
        />
      </div>
    </div>
  )
}
