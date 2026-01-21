import { useNavigate } from 'react-router-dom'
import { Settings, Activity, Copy, MoreHorizontal, Trash2, Play, Square, Server } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { McpServer } from '@/types'
import { useI18n } from '@/i18n/I18nContext'
import { cn } from '@/lib/utils'

interface McpServerCardProps {
  server: McpServer
  onCopyConfig: (server: McpServer) => void
  onPublish: (server: McpServer) => void
  onStop: (server: McpServer) => void
  onDelete: (server: McpServer) => void
}

const statusColors: Record<McpServer['status'], string> = {
  draft: 'bg-gray-500',
  published: 'bg-green-500',
  stopped: 'bg-yellow-500',
  error: 'bg-red-500',
}

const statusLabels: Record<McpServer['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  stopped: 'Stopped',
  error: 'Error',
}

export function McpServerCard({
  server,
  onCopyConfig,
  onPublish,
  onStop,
  onDelete,
}: McpServerCardProps) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const toolCount = server.toolIds?.length || server.tools?.length || 0

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {server.name}
                <span className="text-sm font-normal text-muted-foreground">
                  v{server.version}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={cn('text-white text-xs', statusColors[server.status])}
                >
                  {t.mcpServers?.status?.[server.status] || statusLabels[server.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {toolCount} {t.mcpServers?.card?.tools || 'tools'}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/mcp-servers/${server.id}/config`)}>
                <Settings className="h-4 w-4 mr-2" />
                {t.mcpServers?.card?.configure || 'Configure'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/mcp-servers/${server.id}/monitoring`)}>
                <Activity className="h-4 w-4 mr-2" />
                {t.mcpServers?.card?.monitoring || 'Monitoring'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyConfig(server)}>
                <Copy className="h-4 w-4 mr-2" />
                {t.mcpServers?.card?.copyConfig || 'Copy Config'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {server.status === 'draft' || server.status === 'stopped' ? (
                <DropdownMenuItem onClick={() => onPublish(server)}>
                  <Play className="h-4 w-4 mr-2" />
                  {t.mcpServers?.card?.publish || 'Publish'}
                </DropdownMenuItem>
              ) : server.status === 'published' ? (
                <DropdownMenuItem onClick={() => onStop(server)}>
                  <Square className="h-4 w-4 mr-2" />
                  {t.mcpServers?.card?.stop || 'Stop'}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(server)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.common?.delete || 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="line-clamp-2 mb-4">
          {server.description || (t.mcpServers?.card?.noDescription || 'No description')}
        </CardDescription>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/mcp-servers/${server.id}/config`)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {t.mcpServers?.card?.configure || 'Configure'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/mcp-servers/${server.id}/monitoring`)}
          >
            <Activity className="h-4 w-4 mr-1" />
            {t.mcpServers?.card?.monitoring || 'Monitoring'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyConfig(server)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
