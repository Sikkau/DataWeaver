import { useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ChatMessageList } from './ChatMessageList'
import { ChatInput } from './ChatInput'
import { ChatSuggestions } from './ChatSuggestions'
import { useChatStore, type ToolCall } from '@/stores/useChatStore'
import { useModelStore } from '@/stores/useModelStore'
import { useI18n } from '@/i18n/I18nContext'
import { getSuggestionsForPath } from '@/config/chatContexts'
import { sendChatMessage } from '@/api/chat'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Settings, Server, Unplug } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMcpServers, useMcpServer } from '@/hooks/useMcpServers'
import { useTools, useTestTool } from '@/hooks/useTools'
import type { Tool } from '@/types'

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
    addToolCallToMessage,
    updateToolCallStatus,
    clearMessages,
    setLoading,
    setCurrentStreamingId,
    selectedMcpServerId,
    setSelectedMcpServerId,
  } = useChatStore()

  const { provider, apiKey, baseUrl, model, isValidated } = useModelStore()

  // Fetch MCP servers and tools
  const { data: mcpServers } = useMcpServers()
  const { data: selectedServer } = useMcpServer(selectedMcpServerId || undefined)
  const { data: allTools } = useTools()

  // Get tools from selected server - use toolIds to filter from all tools
  const serverTools = useMemo(() => {
    if (!selectedServer?.toolIds || !allTools) return []
    const toolIdSet = new Set(selectedServer.toolIds)
    return allTools.filter(tool => toolIdSet.has(tool.id) && tool.status === 'active')
  }, [selectedServer, allTools])

  // Tool test mutation
  const testTool = useTestTool()

  const suggestions = getSuggestionsForPath(
    location.pathname,
    language as 'en' | 'zh'
  )

  const isModelConfigured = apiKey && model && isValidated

  // Published servers only
  const publishedServers = useMemo(() => {
    return mcpServers?.filter(s => s.status === 'published') || []
  }, [mcpServers])

  // Execute a tool and return the result
  const executeTool = useCallback(
    async (toolCall: ToolCall, messageId: string): Promise<string> => {
      const tool = serverTools.find(t => t.name === toolCall.name)
      if (!tool) {
        return JSON.stringify({ error: `Tool "${toolCall.name}" not found` })
      }

      updateToolCallStatus(messageId, toolCall.id, 'running')

      const startTime = Date.now()
      try {
        const result = await testTool.mutateAsync({
          id: tool.id,
          parameters: toolCall.arguments,
        })

        const executionTime = Date.now() - startTime
        updateToolCallStatus(
          messageId,
          toolCall.id,
          'success',
          result,
          undefined,
          executionTime
        )

        return JSON.stringify(result)
      } catch (error) {
        const executionTime = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        updateToolCallStatus(
          messageId,
          toolCall.id,
          'error',
          undefined,
          errorMessage,
          executionTime
        )
        return JSON.stringify({ error: errorMessage })
      }
    },
    [serverTools, testTool, updateToolCallStatus]
  )

  // Handle sending a message (or continuing after tool results)
  const sendMessageWithTools = useCallback(
    async (currentMessages: typeof messages, tools: Tool[]) => {
      // Add empty assistant message for streaming
      const assistantId = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      })

      setLoading(true)
      setCurrentStreamingId(assistantId)

      const pendingToolCalls: ToolCall[] = []

      await sendChatMessage(
        currentMessages,
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
          onToolCall: (toolCall) => {
            addToolCallToMessage(assistantId, toolCall)
            pendingToolCalls.push(toolCall)
          },
          onComplete: async () => {
            setMessageStreaming(assistantId, false)

            // If there are tool calls, execute them and continue
            if (pendingToolCalls.length > 0) {
              // Execute all tool calls
              for (const toolCall of pendingToolCalls) {
                const result = await executeTool(toolCall, assistantId)

                // Add tool result message
                addMessage({
                  role: 'tool',
                  content: result,
                  toolCallId: toolCall.id,
                })
              }

              // Get updated messages and continue conversation
              const updatedMessages = useChatStore.getState().messages
              await sendMessageWithTools(updatedMessages, tools)
            } else {
              setLoading(false)
              setCurrentStreamingId(null)
            }
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
        },
        tools.length > 0 ? tools : undefined
      )
    },
    [
      provider,
      apiKey,
      baseUrl,
      model,
      addMessage,
      updateMessage,
      setMessageStreaming,
      addToolCallToMessage,
      setLoading,
      setCurrentStreamingId,
      executeTool,
      t,
    ]
  )

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

      // Get current messages including the new one
      const allMessages = [
        ...messages,
        { id: '', role: 'user' as const, content, timestamp: Date.now() },
      ]

      await sendMessageWithTools(allMessages, serverTools)
    },
    [
      isModelConfigured,
      messages,
      serverTools,
      addMessage,
      sendMessageWithTools,
      t,
    ]
  )

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      handleSendMessage(suggestion)
    },
    [handleSendMessage]
  )

  const handleDisconnectServer = useCallback(() => {
    setSelectedMcpServerId(null)
  }, [setSelectedMcpServerId])

  return (
    <div
      className={cn(
        'relative bg-background',
        isFullScreen ? 'h-full' : 'h-[500px]',
        className
      )}
    >
      {/* Header - absolute top */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{t.chat?.title || 'Chat'}</h2>
          {selectedServer && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <Server className="h-3 w-3" />
              <span>{selectedServer.name}</span>
              <span className="text-muted-foreground/60">
                ({serverTools.length} {t.chat?.tools || 'tools'})
              </span>
              <button
                onClick={handleDisconnectServer}
                className="ml-1 hover:text-destructive"
                title={t.chat?.disconnect || 'Disconnect'}
              >
                <Unplug className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* MCP Server Selector */}
          {publishedServers.length > 0 && !selectedMcpServerId && (
            <Select
              value={selectedMcpServerId || ''}
              onValueChange={(value) => setSelectedMcpServerId(value || null)}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder={t.chat?.selectServer || 'Connect MCP'} />
              </SelectTrigger>
              <SelectContent>
                {publishedServers.map((server) => (
                  <SelectItem key={server.id} value={server.id}>
                    <div className="flex items-center gap-2">
                      <Server className="h-3 w-3" />
                      <span>{server.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!isModelConfigured && (
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="gap-1 h-8">
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
              className="h-8 w-8"
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
          // Top offset for header (48px)
          'top-[48px]',
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
