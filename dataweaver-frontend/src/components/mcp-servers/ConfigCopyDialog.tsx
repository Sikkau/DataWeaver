import { useState, useEffect } from 'react'
import { Copy, Check, FileJson, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { McpConfigExport, McpServer } from '@/types'
import { useGetMcpConfigExport } from '@/hooks/useMcpServers'
import { useI18n } from '@/i18n/I18nContext'
import { toast } from 'sonner'

interface ConfigCopyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  server: McpServer | null
}

export function ConfigCopyDialog({ open, onOpenChange, server }: ConfigCopyDialogProps) {
  const { t } = useI18n()
  const getConfigExport = useGetMcpConfigExport()
  const [config, setConfig] = useState<McpConfigExport | null>(null)
  const [copied, setCopied] = useState(false)

  // Load config when dialog opens
  useEffect(() => {
    if (open && server) {
      getConfigExport.mutateAsync(server.id).then(setConfig).catch(() => setConfig(null))
    } else {
      setConfig(null)
    }
  }, [open, server])

  // Reset copied state
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const handleCopy = async () => {
    if (!config) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      setCopied(true)
      toast.success(t.mcpServers?.configCopy?.copied || 'Copied to clipboard!')
    } catch {
      toast.error(t.mcpServers?.configCopy?.copyFailed || 'Failed to copy')
    }
  }

  const configJson = config ? JSON.stringify(config, null, 2) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            {t.mcpServers?.configCopy?.title || 'MCP Configuration'}
          </DialogTitle>
          <DialogDescription>
            {t.mcpServers?.configCopy?.description || 'Copy this configuration to use with your MCP client.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Usage Instructions */}
          <Alert>
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p className="font-medium">
                  {t.mcpServers?.configCopy?.usageTitle || 'How to use:'}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>{t.mcpServers?.configCopy?.step1 || 'Copy the configuration below'}</li>
                  <li>{t.mcpServers?.configCopy?.step2 || 'Add it to your MCP client configuration file (e.g., claude_desktop_config.json)'}</li>
                  <li>{t.mcpServers?.configCopy?.step3 || 'Restart your MCP client to apply changes'}</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          {/* Config Display */}
          <div className="relative">
            <div className="absolute right-2 top-2 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!config || getConfigExport.isPending}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    {t.mcpServers?.configCopy?.copied || 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    {t.mcpServers?.configCopy?.copy || 'Copy'}
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="h-[300px] border rounded-lg bg-muted/30">
              {getConfigExport.isPending ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : config ? (
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                  <code>{configJson}</code>
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t.mcpServers?.configCopy?.loadFailed || 'Failed to load configuration'}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Server Info */}
          {server && (
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium">{t.mcpServers?.configCopy?.serverName || 'Server'}:</span>{' '}
                {server.name} (v{server.version})
              </p>
              {server.endpoint && (
                <p>
                  <span className="font-medium">{t.mcpServers?.configCopy?.endpoint || 'Endpoint'}:</span>{' '}
                  <code className="bg-muted px-1 rounded">{server.endpoint}</code>
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
