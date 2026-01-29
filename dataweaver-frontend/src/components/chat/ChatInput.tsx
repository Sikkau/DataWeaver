import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/I18nContext'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  className,
}: ChatInputProps) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isLoading || disabled) return

    onSend(trimmed)
    setValue('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isLoading, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Don't send when composing with IME (e.g., Chinese input)
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  return (
    <div className={cn('flex gap-2 p-4 border-t bg-background', className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={t.chat?.inputPlaceholder || 'Type your message...'}
        disabled={isLoading || disabled}
        className={cn(
          'flex-1 resize-none rounded-md border border-input bg-background px-3 py-2',
          'text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[40px] max-h-[200px]'
        )}
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading || disabled}
        size="icon"
        className="shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
