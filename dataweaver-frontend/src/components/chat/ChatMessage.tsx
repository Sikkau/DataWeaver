import { memo, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/stores/useChatStore'
import { Bot, User, Loader2, Brain, ChevronDown, ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'

interface ChatMessageProps {
  message: ChatMessageType
}

interface ParsedContent {
  thinkContent: string | null
  mainContent: string
  isThinkingComplete: boolean
}

function parseThinkTags(content: string): ParsedContent {
  // Match <think>...</think> tags
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g
  const openThinkRegex = /<think>([\s\S]*)$/

  let thinkContent: string | null = null
  let mainContent = content
  let isThinkingComplete = true

  // Check for complete think tags
  const completeMatch = content.match(thinkRegex)
  if (completeMatch) {
    // Extract all think content
    const thinkParts: string[] = []

    let match
    while ((match = thinkRegex.exec(content)) !== null) {
      thinkParts.push(match[1].trim())
    }

    if (thinkParts.length > 0) {
      thinkContent = thinkParts.join('\n\n')
      // Remove think tags from main content
      mainContent = content.replace(thinkRegex, '').trim()
    }
  } else {
    // Check for incomplete think tag (still streaming)
    const openMatch = content.match(openThinkRegex)
    if (openMatch) {
      thinkContent = openMatch[1].trim()
      mainContent = content.replace(openThinkRegex, '').trim()
      isThinkingComplete = false
    }
  }

  return { thinkContent, mainContent, isThinkingComplete }
}

function ThinkingBlock({
  content,
  isComplete,
  isStreaming,
}: {
  content: string
  isComplete: boolean
  isStreaming?: boolean
}) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(!isComplete)

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md',
          'bg-purple-500/10 text-purple-600 dark:text-purple-400',
          'hover:bg-purple-500/20 transition-colors',
          !isComplete && 'animate-pulse'
        )}
      >
        <Brain className={cn('h-3 w-3', !isComplete && 'animate-spin')} />
        <span>
          {isComplete
            ? t.chat?.thinking || 'Thinking'
            : t.chat?.thinkingInProgress || 'Thinking...'}
        </span>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>

      {isExpanded && (
        <div
          className={cn(
            'mt-2 p-3 rounded-md text-xs',
            'bg-purple-500/5 border border-purple-500/20',
            'text-muted-foreground italic',
            !isComplete && 'border-purple-500/40'
          )}
        >
          <div className="whitespace-pre-wrap">{content}</div>
          {!isComplete && isStreaming && (
            <span className="inline-block h-3 w-1 ml-0.5 animate-pulse bg-purple-500" />
          )}
        </div>
      )}
    </div>
  )
}

export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === 'user'

  const parsed = useMemo(
    () => parseThinkTags(message.content),
    [message.content]
  )

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {message.isStreaming && !message.content ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              ) : (
                <>
                  {/* Thinking block */}
                  {parsed.thinkContent && (
                    <ThinkingBlock
                      content={parsed.thinkContent}
                      isComplete={parsed.isThinkingComplete}
                      isStreaming={message.isStreaming}
                    />
                  )}

                  {/* Main content */}
                  {parsed.mainContent && (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        code: ({ className, children, ...props }) => {
                          const isInline = !className
                          return isInline ? (
                            <code
                              className="rounded bg-background/50 px-1 py-0.5 text-xs font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code
                              className={cn(
                                'block overflow-x-auto rounded-md bg-background/50 p-3 text-xs font-mono',
                                className
                              )}
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        pre: ({ children }) => (
                          <pre className="my-2 overflow-x-auto rounded-md bg-background/50 p-0">
                            {children}
                          </pre>
                        ),
                        ul: ({ children }) => (
                          <ul className="my-2 list-disc pl-4">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="my-2 list-decimal pl-4">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-1">{children}</li>
                        ),
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            className="text-primary underline hover:no-underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {parsed.mainContent}
                    </ReactMarkdown>
                  )}

                  {/* Streaming cursor - only show if there's main content being streamed */}
                  {message.isStreaming &&
                    parsed.mainContent &&
                    parsed.isThinkingComplete && (
                      <span className="inline-block h-4 w-1 animate-pulse bg-current" />
                    )}
                </>
              )}
            </div>
          )}
        </div>

        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
})
