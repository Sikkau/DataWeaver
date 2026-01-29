import { useCallback } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import type { Query, ToolFormData } from '@/types'
import { useI18n } from '@/i18n/I18nContext'
import { useGenerateDescription } from '@/hooks/useTools'
import { useModelStore } from '@/stores/useModelStore'

interface ToolFormProps {
  data: Partial<ToolFormData>
  onChange: (data: Partial<ToolFormData>) => void
  queries: Query[]
  isLoadingQueries?: boolean
}

// Convert display name to snake_case name
function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
}

export function ToolForm({ data, onChange, queries, isLoadingQueries }: ToolFormProps) {
  const { t } = useI18n()
  const generateDescription = useGenerateDescription()
  const { isValidated: isModelConfigured } = useModelStore()

  const handleDisplayNameChange = useCallback((value: string) => {
    onChange({
      ...data,
      displayName: value,
      // Auto-generate snake_case name from display name if name is empty or was auto-generated
      name: data.name === toSnakeCase(data.displayName || '') || !data.name
        ? toSnakeCase(value)
        : data.name,
    })
  }, [data, onChange])

  const handleNameChange = useCallback((value: string) => {
    // Allow only lowercase letters, numbers, and underscores
    // Don't trim underscores so user can type them
    const validName = value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
    onChange({ ...data, name: validName })
  }, [data, onChange])

  const handleQueryChange = useCallback((queryId: string) => {
    const selectedQuery = queries.find(q => q.id === queryId)
    onChange({
      ...data,
      queryId,
      // If no display name yet, use query name
      displayName: data.displayName || selectedQuery?.name || '',
      name: data.name || toSnakeCase(selectedQuery?.name || ''),
    })
  }, [data, onChange, queries])

  const handleGenerateDescription = useCallback(async () => {
    if (!data.queryId) return

    try {
      const result = await generateDescription.mutateAsync({ queryId: data.queryId })
      if (result?.description) {
        onChange({ ...data, description: result.description })
      }
    } catch {
      // Error handled in hook
    }
  }, [data, onChange, generateDescription])

  return (
    <div className="space-y-4">
      {/* Query Selection */}
      <div className="space-y-2">
        <Label>{t.tools?.form?.query || 'Associated Query'} <span className="text-destructive">*</span></Label>
        <Select value={data.queryId || ''} onValueChange={handleQueryChange}>
          <SelectTrigger>
            <SelectValue placeholder={t.tools?.form?.queryPlaceholder || 'Select a query'} />
          </SelectTrigger>
          <SelectContent>
            {isLoadingQueries ? (
              <div className="p-2 text-center text-muted-foreground text-sm">
                {t.common?.loading || 'Loading...'}
              </div>
            ) : queries.length === 0 ? (
              <div className="p-2 text-center text-muted-foreground text-sm">
                {t.tools?.form?.noQueries || 'No queries available'}
              </div>
            ) : (
              queries.map((query) => (
                <SelectItem key={query.id} value={query.id}>
                  <div className="flex flex-col">
                    <span>{query.name}</span>
                    {query.description && (
                      <span className="text-xs text-muted-foreground">{query.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label>{t.tools?.form?.displayName || 'Display Name'} <span className="text-destructive">*</span></Label>
        <Input
          value={data.displayName || ''}
          onChange={(e) => handleDisplayNameChange(e.target.value)}
          placeholder={t.tools?.form?.displayNamePlaceholder || 'User-friendly name'}
        />
      </div>

      {/* Tool Name (snake_case) */}
      <div className="space-y-2">
        <Label>{t.tools?.form?.name || 'Tool Name (snake_case)'} <span className="text-destructive">*</span></Label>
        <Input
          value={data.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t.tools?.form?.namePlaceholder || 'tool_name'}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          {t.tools?.form?.nameHint || 'Used as the MCP tool identifier. Only lowercase letters, numbers, and underscores.'}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t.tools?.form?.description || 'Description'} <span className="text-destructive">*</span></Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={!data.queryId || !isModelConfigured || generateDescription.isPending}
                  >
                    {generateDescription.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {t.tools?.form?.generateDescription || 'AI Generate'}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {!isModelConfigured
                  ? (t.tools?.form?.configureModelFirst || '请先在设置中配置 AI 模型')
                  : !data.queryId
                  ? (t.tools?.form?.selectQueryFirst || '请先选择一个 Query')
                  : (t.tools?.form?.generateDescriptionTooltip || '使用 AI 自动生成工具描述')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder={t.tools?.form?.descriptionPlaceholder || 'Describe what this tool does. Supports Markdown.'}
          className="min-h-[150px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {t.tools?.form?.descriptionHint || 'This description will be shown to AI models. Be clear and concise.'}
        </p>
      </div>
    </div>
  )
}
