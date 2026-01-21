import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Server, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { McpServerCard } from '@/components/mcp-servers/McpServerCard'
import { ConfigCopyDialog } from '@/components/mcp-servers/ConfigCopyDialog'
import {
  useMcpServers,
  useCreateMcpServer,
  useDeleteMcpServer,
  usePublishMcpServer,
  useStopMcpServer,
} from '@/hooks/useMcpServers'
import type { McpServer, McpServerFormData } from '@/types'
import { useI18n } from '@/i18n/I18nContext'

const defaultConfig: McpServerFormData['config'] = {
  timeout: 30,
  rateLimit: 60,
  logLevel: 'info',
  enableCache: false,
}

const defaultAccessControl: McpServerFormData['accessControl'] = {
  apiKeyRequired: true,
  allowedOrigins: [],
  ipWhitelist: [],
}

export function McpServers() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: servers, isLoading } = useMcpServers()
  const createServer = useCreateMcpServer()
  const deleteServer = useDeleteMcpServer()
  const publishServer = usePublishMcpServer()
  const stopServer = useStopMcpServer()

  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [configCopyDialogOpen, setConfigCopyDialogOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null)
  const [newServerName, setNewServerName] = useState('')
  const [newServerDescription, setNewServerDescription] = useState('')

  // Filter servers by search
  const filteredServers = (servers || []).filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Create new server
  const handleCreate = useCallback(async () => {
    if (!newServerName.trim()) return

    try {
      const newServer = await createServer.mutateAsync({
        name: newServerName.trim(),
        description: newServerDescription.trim(),
        toolIds: [],
        config: defaultConfig,
        accessControl: defaultAccessControl,
      })
      setCreateDialogOpen(false)
      setNewServerName('')
      setNewServerDescription('')
      navigate(`/mcp-servers/${newServer.id}/config`)
    } catch {
      // Error handled in hook
    }
  }, [newServerName, newServerDescription, createServer, navigate])

  // Handle copy config
  const handleCopyConfig = useCallback((server: McpServer) => {
    setSelectedServer(server)
    setConfigCopyDialogOpen(true)
  }, [])

  // Handle publish
  const handlePublish = useCallback(async (server: McpServer) => {
    try {
      await publishServer.mutateAsync(server.id)
      setSelectedServer(server)
      setConfigCopyDialogOpen(true)
    } catch {
      // Error handled in hook
    }
  }, [publishServer])

  // Handle stop
  const handleStop = useCallback(async (server: McpServer) => {
    await stopServer.mutateAsync(server.id)
  }, [stopServer])

  // Handle delete
  const handleDeleteClick = useCallback((server: McpServer) => {
    setSelectedServer(server)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedServer) {
      await deleteServer.mutateAsync(selectedServer.id)
      setSelectedServer(null)
      setDeleteDialogOpen(false)
    }
  }, [selectedServer, deleteServer])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            {t.mcpServers?.title || 'MCP Servers'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.mcpServers?.subtitle || 'Manage and publish your MCP servers'}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.mcpServers?.create || 'New Server'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.mcpServers?.searchPlaceholder || 'Search servers...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Server Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          {t.common?.loading || 'Loading...'}
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Server className="h-16 w-16 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery
              ? (t.mcpServers?.noResults || 'No servers found')
              : (t.mcpServers?.empty || 'No MCP servers yet')
            }
          </h3>
          {!searchQuery && (
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.mcpServers?.createFirst || 'Create your first server'}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <McpServerCard
              key={server.id}
              server={server}
              onCopyConfig={handleCopyConfig}
              onPublish={handlePublish}
              onStop={handleStop}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.mcpServers?.createDialog?.title || 'Create MCP Server'}</DialogTitle>
            <DialogDescription>
              {t.mcpServers?.createDialog?.subtitle || 'Create a new MCP server to expose your tools.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.mcpServers?.createDialog?.name || 'Name'} <span className="text-destructive">*</span></Label>
              <Input
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder={t.mcpServers?.createDialog?.namePlaceholder || 'my-mcp-server'}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.mcpServers?.createDialog?.descriptionLabel || 'Description'}</Label>
              <Textarea
                value={newServerDescription}
                onChange={(e) => setNewServerDescription(e.target.value)}
                placeholder={t.mcpServers?.createDialog?.descriptionPlaceholder || 'Describe your MCP server...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t.common?.cancel || 'Cancel'}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newServerName.trim() || createServer.isPending}
            >
              {createServer.isPending
                ? (t.common?.saving || 'Creating...')
                : (t.common?.create || 'Create')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.mcpServers?.deleteDialog?.title || 'Delete Server'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.mcpServers?.deleteDialog?.description || 'Are you sure you want to delete this MCP server? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common?.cancel || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common?.delete || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Config Copy Dialog */}
      <ConfigCopyDialog
        open={configCopyDialogOpen}
        onOpenChange={setConfigCopyDialogOpen}
        server={selectedServer}
      />
    </div>
  )
}
