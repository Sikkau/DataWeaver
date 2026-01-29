import { useCallback, useRef, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChatFloatingButton } from './ChatFloatingButton'
import { ChatPanel } from './ChatPanel'
import { useChatStore } from '@/stores/useChatStore'
import { cn } from '@/lib/utils'

const MIN_WIDTH = 320
const MAX_WIDTH = 600
const MIN_HEIGHT = 400
const MAX_HEIGHT = 800

type ResizeDirection = 'n' | 'w' | 'nw' | null

export function ChatWidget() {
  const location = useLocation()
  const { isWidgetOpen, toggleWidget, widgetSize, setWidgetSize } = useChatStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startSizeRef = useRef({ width: 0, height: 0 })

  const handleMouseDown = useCallback(
    (direction: ResizeDirection) => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setResizeDirection(direction)
      startPosRef.current = { x: e.clientX, y: e.clientY }
      startSizeRef.current = { width: widgetSize.width, height: widgetSize.height }
    },
    [widgetSize]
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startPosRef.current.x - e.clientX
      const deltaY = startPosRef.current.y - e.clientY

      let newWidth = startSizeRef.current.width
      let newHeight = startSizeRef.current.height

      if (resizeDirection?.includes('w')) {
        newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startSizeRef.current.width + deltaX))
      }
      if (resizeDirection?.includes('n')) {
        newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startSizeRef.current.height + deltaY))
      }

      setWidgetSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeDirection(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeDirection, setWidgetSize])

  // Don't show on the chat page since it has full-screen chat
  if (location.pathname === '/chat') {
    return null
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Chat Panel */}
      <div
        ref={panelRef}
        style={{
          width: widgetSize.width,
          height: widgetSize.height,
        }}
        className={cn(
          'absolute bottom-20 right-0 rounded-xl border bg-background shadow-2xl',
          'origin-bottom-right',
          isResizing ? '' : 'transition-all duration-300',
          isWidgetOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Resize handles */}
        {isWidgetOpen && (
          <>
            {/* Top edge */}
            <div
              className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-20 hover:bg-primary/20 rounded-t-xl"
              onMouseDown={handleMouseDown('n')}
            />
            {/* Left edge */}
            <div
              className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-20 hover:bg-primary/20 rounded-l-xl"
              onMouseDown={handleMouseDown('w')}
            />
            {/* Top-left corner */}
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-30 hover:bg-primary/20 rounded-tl-xl"
              onMouseDown={handleMouseDown('nw')}
            />
          </>
        )}

        <ChatPanel className="h-full rounded-xl overflow-hidden" />
      </div>

      {/* Floating Button */}
      <ChatFloatingButton isOpen={isWidgetOpen} onClick={toggleWidget} />

      {/* Overlay to capture mouse events during resize */}
      {isResizing && (
        <div className="fixed inset-0 z-40 cursor-nw-resize" />
      )}
    </div>
  )
}
