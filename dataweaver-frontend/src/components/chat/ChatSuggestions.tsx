import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface ChatSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export function ChatSuggestions({
  suggestions,
  onSelect,
  className,
}: ChatSuggestionsProps) {
  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-2 p-4', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-auto whitespace-normal text-left py-2 px-3"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
