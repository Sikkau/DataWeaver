import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { McpServerConfig } from '@/types'
import { useI18n } from '@/i18n/I18nContext'

interface ConfigPanelProps {
  config: McpServerConfig
  onChange: (config: McpServerConfig) => void
}

const LOG_LEVELS = [
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warning' },
  { value: 'error', label: 'Error' },
]

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const { t } = useI18n()

  const updateConfig = <K extends keyof McpServerConfig>(
    key: K,
    value: McpServerConfig[K]
  ) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Timeout */}
      <div className="space-y-2">
        <Label>{t.mcpServers?.config?.timeout || 'Timeout (seconds)'}</Label>
        <Input
          type="number"
          min={1}
          max={300}
          value={config.timeout}
          onChange={(e) => updateConfig('timeout', Number(e.target.value) || 30)}
        />
        <p className="text-xs text-muted-foreground">
          {t.mcpServers?.config?.timeoutHint || 'Maximum execution time for each tool call'}
        </p>
      </div>

      {/* Rate Limit */}
      <div className="space-y-2">
        <Label>{t.mcpServers?.config?.rateLimit || 'Rate Limit (requests/minute)'}</Label>
        <Input
          type="number"
          min={1}
          max={1000}
          value={config.rateLimit}
          onChange={(e) => updateConfig('rateLimit', Number(e.target.value) || 60)}
        />
        <p className="text-xs text-muted-foreground">
          {t.mcpServers?.config?.rateLimitHint || 'Maximum number of requests allowed per minute'}
        </p>
      </div>

      {/* Log Level */}
      <div className="space-y-2">
        <Label>{t.mcpServers?.config?.logLevel || 'Log Level'}</Label>
        <Select
          value={config.logLevel}
          onValueChange={(value) => updateConfig('logLevel', value as McpServerConfig['logLevel'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOG_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {t.mcpServers?.config?.logLevels?.[level.value as keyof typeof t.mcpServers.config.logLevels] || level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t.mcpServers?.config?.logLevelHint || 'Minimum log level to record'}
        </p>
      </div>

      {/* Enable Cache */}
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label>{t.mcpServers?.config?.enableCache || 'Enable Cache'}</Label>
          <p className="text-xs text-muted-foreground">
            {t.mcpServers?.config?.enableCacheHint || 'Cache tool responses for repeated queries'}
          </p>
        </div>
        <Switch
          checked={config.enableCache}
          onCheckedChange={(checked: boolean) => updateConfig('enableCache', checked)}
        />
      </div>

      {/* Cache Expiration (only shown when cache is enabled) */}
      {config.enableCache && (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          <Label>{t.mcpServers?.config?.cacheExpiration || 'Cache Expiration (ms)'}</Label>
          <Input
            type="number"
            min={1000}
            max={86400000}
            value={config.cacheExpirationMs || 300000}
            onChange={(e) => updateConfig('cacheExpirationMs', Number(e.target.value) || 300000)}
          />
          <p className="text-xs text-muted-foreground">
            {t.mcpServers?.config?.cacheExpirationHint || 'How long to keep cached responses (default: 5 minutes)'}
          </p>
        </div>
      )}
    </div>
  )
}
