import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { McpServerAccessControl } from '@/types'
import { useI18n } from '@/i18n/I18nContext'

interface AccessControlPanelProps {
  accessControl: McpServerAccessControl
  onChange: (accessControl: McpServerAccessControl) => void
}

export function AccessControlPanel({ accessControl, onChange }: AccessControlPanelProps) {
  const { t } = useI18n()
  const [newOrigin, setNewOrigin] = useState('')
  const [newIp, setNewIp] = useState('')

  const updateAccessControl = <K extends keyof McpServerAccessControl>(
    key: K,
    value: McpServerAccessControl[K]
  ) => {
    onChange({ ...accessControl, [key]: value })
  }

  // Add allowed origin
  const addOrigin = () => {
    if (newOrigin.trim() && !accessControl.allowedOrigins.includes(newOrigin.trim())) {
      updateAccessControl('allowedOrigins', [...accessControl.allowedOrigins, newOrigin.trim()])
      setNewOrigin('')
    }
  }

  // Remove allowed origin
  const removeOrigin = (origin: string) => {
    updateAccessControl('allowedOrigins', accessControl.allowedOrigins.filter(o => o !== origin))
  }

  // Add IP to whitelist
  const addIp = () => {
    if (newIp.trim() && !accessControl.ipWhitelist.includes(newIp.trim())) {
      updateAccessControl('ipWhitelist', [...accessControl.ipWhitelist, newIp.trim()])
      setNewIp('')
    }
  }

  // Remove IP from whitelist
  const removeIp = (ip: string) => {
    updateAccessControl('ipWhitelist', accessControl.ipWhitelist.filter(i => i !== ip))
  }

  return (
    <div className="space-y-6">
      {/* API Key Required */}
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label>{t.mcpServers?.accessControl?.apiKeyRequired || 'Require API Key'}</Label>
          <p className="text-xs text-muted-foreground">
            {t.mcpServers?.accessControl?.apiKeyRequiredHint || 'Clients must provide a valid API key to access this server'}
          </p>
        </div>
        <Switch
          checked={accessControl.apiKeyRequired}
          onCheckedChange={(checked: boolean) => updateAccessControl('apiKeyRequired', checked)}
        />
      </div>

      {/* Allowed Origins */}
      <div className="space-y-3">
        <div>
          <Label>{t.mcpServers?.accessControl?.allowedOrigins || 'Allowed Origins (CORS)'}</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {t.mcpServers?.accessControl?.allowedOriginsHint || 'List of allowed origins for cross-origin requests. Leave empty to allow all.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={t.mcpServers?.accessControl?.originPlaceholder || 'https://example.com'}
            value={newOrigin}
            onChange={(e) => setNewOrigin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOrigin())}
          />
          <Button type="button" variant="outline" onClick={addOrigin}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {accessControl.allowedOrigins.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {accessControl.allowedOrigins.map((origin) => (
              <Badge key={origin} variant="secondary" className="gap-1 pr-1">
                {origin}
                <button
                  type="button"
                  onClick={() => removeOrigin(origin)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* IP Whitelist */}
      <div className="space-y-3">
        <div>
          <Label>{t.mcpServers?.accessControl?.ipWhitelist || 'IP Whitelist'}</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {t.mcpServers?.accessControl?.ipWhitelistHint || 'Only allow requests from these IP addresses. Leave empty to allow all.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={t.mcpServers?.accessControl?.ipPlaceholder || '192.168.1.1 or 10.0.0.0/24'}
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIp())}
          />
          <Button type="button" variant="outline" onClick={addIp}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {accessControl.ipWhitelist.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {accessControl.ipWhitelist.map((ip) => (
              <Badge key={ip} variant="secondary" className="gap-1 pr-1 font-mono">
                {ip}
                <button
                  type="button"
                  onClick={() => removeIp(ip)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
