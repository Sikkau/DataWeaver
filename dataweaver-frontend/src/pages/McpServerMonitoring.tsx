import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonitoringDashboard } from '@/components/mcp-servers/MonitoringDashboard'
import { useMcpServer, useMcpServerStats, useMcpServerLogs } from '@/hooks/useMcpServers'
import { useI18n } from '@/i18n/I18nContext'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  published: 'bg-green-500',
  stopped: 'bg-yellow-500',
  error: 'bg-red-500',
}

export function McpServerMonitoringPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: server, isLoading: isLoadingServer } = useMcpServer(id)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useMcpServerStats(id, autoRefresh)
  const { data: logsData, isLoading: isLoadingLogs } = useMcpServerLogs(id, { page: 1, pageSize: 20 })

  const logs = logsData?.data || []

  if (isLoadingServer) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-muted-foreground">
        <h2 className="text-xl font-medium mb-2">{t.mcpServers?.notFound || 'Server not found'}</h2>
        <Button variant="outline" onClick={() => navigate('/mcp-servers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.mcpServers?.backToList || 'Back to list'}
        </Button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mcp-servers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                {server.name}
                <Badge
                  variant="secondary"
                  className={cn('text-white text-xs', statusColors[server.status])}
                >
                  {server.status}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                {t.mcpServers?.monitoring?.title || 'Monitoring Dashboard'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            {autoRefresh
              ? (t.mcpServers?.monitoring?.autoRefreshOn || 'Auto-refresh ON')
              : (t.mcpServers?.monitoring?.autoRefreshOff || 'Auto-refresh OFF')
            }
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            disabled={isLoadingStats}
          >
            <RefreshCw className={cn('h-4 w-4', isLoadingStats && 'animate-spin')} />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/mcp-servers/${id}/config`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t.mcpServers?.monitoring?.configure || 'Configure'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {server.status === 'draft' ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">
              {t.mcpServers?.monitoring?.notPublished || 'Server not published'}
            </h3>
            <p className="text-sm mb-4">
              {t.mcpServers?.monitoring?.notPublishedDesc || 'Publish the server to see monitoring data.'}
            </p>
            <Button onClick={() => navigate(`/mcp-servers/${id}/config`)}>
              <Settings className="h-4 w-4 mr-2" />
              {t.mcpServers?.monitoring?.goToConfigure || 'Go to Configure'}
            </Button>
          </div>
        ) : (
          <MonitoringDashboard
            stats={stats || null}
            logs={logs}
            isLoading={isLoadingStats || isLoadingLogs}
          />
        )}
      </div>
    </div>
  )
}
