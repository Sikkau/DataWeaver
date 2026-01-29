import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCircle, X } from 'lucide-react'

interface ChatFloatingButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export function ChatFloatingButton({
  isOpen,
  onClick,
  className,
}: ChatFloatingButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
        'hover:scale-105 active:scale-95',
        isOpen && 'rotate-90',
        className
      )}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <MessageCircle className="h-6 w-6" />
      )}
    </Button>
  )
}
