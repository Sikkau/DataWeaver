import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
}

export interface WidgetSize {
  width: number
  height: number
}

interface ChatState {
  messages: ChatMessage[]
  isWidgetOpen: boolean
  isLoading: boolean
  currentStreamingId: string | null
  widgetSize: WidgetSize

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, content: string) => void
  setMessageStreaming: (id: string, isStreaming: boolean) => void
  clearMessages: () => void
  setWidgetOpen: (open: boolean) => void
  toggleWidget: () => void
  setLoading: (loading: boolean) => void
  setCurrentStreamingId: (id: string | null) => void
  setWidgetSize: (size: WidgetSize) => void
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const DEFAULT_WIDGET_SIZE: WidgetSize = {
  width: 400,
  height: 500,
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isWidgetOpen: false,
      isLoading: false,
      currentStreamingId: null,
      widgetSize: DEFAULT_WIDGET_SIZE,

      addMessage: (message) => {
        const id = generateId()
        const newMessage: ChatMessage = {
          ...message,
          id,
          timestamp: Date.now(),
        }
        set((state) => ({
          messages: [...state.messages, newMessage],
        }))
        return id
      },

      updateMessage: (id, content) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, content } : msg
          ),
        }))
      },

      setMessageStreaming: (id, isStreaming) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, isStreaming } : msg
          ),
        }))
      },

      clearMessages: () => {
        set({ messages: [], currentStreamingId: null })
      },

      setWidgetOpen: (open) => {
        set({ isWidgetOpen: open })
      },

      toggleWidget: () => {
        set((state) => ({ isWidgetOpen: !state.isWidgetOpen }))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setCurrentStreamingId: (id) => {
        set({ currentStreamingId: id })
      },

      setWidgetSize: (size) => {
        set({ widgetSize: size })
      },
    }),
    {
      name: 'dataweaver-chat-storage',
      partialize: (state) => ({
        messages: state.messages.filter((m) => !m.isStreaming),
        isWidgetOpen: state.isWidgetOpen,
        widgetSize: state.widgetSize,
      }),
    }
  )
)
