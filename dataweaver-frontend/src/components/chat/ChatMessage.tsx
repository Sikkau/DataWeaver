import { memo, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType, ToolCall } from '@/stores/useChatStore'
import {
  Bot,
  User,
  Loader2,
  Brain,
  ChevronDown,
  ChevronRight,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
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

function ToolCallBlock({ toolCall }: { toolCall: ToolCall }) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)

  const statusIcon = {
    pending: <Clock className="h-3 w-3 text-muted-foreground" />,
    running: <Loader2 className="h-3 w-3 animate-spin text-blue-500" />,
    success: <CheckCircle2 className="h-3 w-3 text-green-500" />,
    error: <XCircle className="h-3 w-3 text-red-500" />,
  }

  const statusColor = {
    pending: 'bg-muted/50 border-muted',
    running: 'bg-blue-500/10 border-blue-500/30',
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
  }

  return (
    <div className={cn('my-2 rounded-md border p-2', statusColor[toolCall.status])}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <Wrench className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-medium flex-1">{toolCall.name}</span>
        {statusIcon[toolCall.status]}
        {toolCall.executionTime && (
          <span className="text-xs text-muted-foreground">
            {toolCall.executionTime}ms
          </span>
        )}
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Arguments */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t.chat?.toolArguments || 'Arguments'}:
            </div>
            <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {toolCall.status === 'success' && toolCall.result != null && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {t.chat?.toolResult || 'Result'}:
              </div>
              <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto max-h-[200px]">
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {toolCall.status === 'error' && toolCall.error && (
            <div>
              <div className="text-xs text-red-500 mb-1">
                {t.chat?.toolError || 'Error'}:
              </div>
              <pre className="text-xs bg-red-500/10 p-2 rounded text-red-600 dark:text-red-400">
                {toolCall.error}
              </pre>
            </div>
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
  const isTool = message.role === 'tool'

  // Don't render tool result messages - they're internal
  if (isTool) {
    return null
  }

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
              {message.isStreaming && !message.content && !message.toolCalls?.length ? (
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

                  {/* Tool calls */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="space-y-1">
                      {message.toolCalls.map((tc) => (
                        <ToolCallBlock key={tc.id} toolCall={tc} />
                      ))}
                    </div>
                  )}

                  {/* Main content */}
                  {parsed.mainContent && (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
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
                        table: ({ children }) => (
                          <div className="my-3 overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-muted/50 border-b">
                            {children}
                          </thead>
                        ),
                        tbody: ({ children }) => (
                          <tbody className="divide-y">
                            {children}
                          </tbody>
                        ),
                        tr: ({ children }) => (
                          <tr className="hover:bg-muted/30 transition-colors">
                            {children}
                          </tr>
                        ),
                        th: ({ children }) => (
                          <th className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-2 text-muted-foreground">
                            {children}
                          </td>
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
