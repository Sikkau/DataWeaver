import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Play, Rocket, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ToolSelector } from '@/components/mcp-servers/ToolSelector'
import { ConfigPanel } from '@/components/mcp-servers/ConfigPanel'
import { AccessControlPanel } from '@/components/mcp-servers/AccessControlPanel'
import { ConfigCopyDialog } from '@/components/mcp-servers/ConfigCopyDialog'
import {
  useMcpServer,
  useUpdateMcpServer,
  useTestMcpServer,
  usePublishMcpServer,
} from '@/hooks/useMcpServers'
import { useTools } from '@/hooks/useTools'
import type { McpServerFormData, McpServerConfig, McpServerAccessControl } from '@/types'
import { useI18n } from '@/i18n/I18nContext'

export function McpServerConfigPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: server, isLoading: isLoadingServer } = useMcpServer(id)
  const { data: tools, isLoading: isLoadingTools } = useTools()
  const updateServer = useUpdateMcpServer()
  const testServer = useTestMcpServer()
  const publishServer = usePublishMcpServer()

  const [formData, setFormData] = useState<Partial<McpServerFormData>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null)
  const [configCopyDialogOpen, setConfigCopyDialogOpen] = useState(false)

  // Initialize form data from server
  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        description: server.description,
        toolIds: server.toolIds || [],
        config: server.config,
        accessControl: server.accessControl,
      })
      setHasChanges(false)
    }
  }, [server])

  // Update form data
  const updateFormData = useCallback(<K extends keyof McpServerFormData>(
    key: K,
    value: McpServerFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  // Save changes
  const handleSave = async () => {
    if (!id) return
    try {
      await updateServer.mutateAsync({ id, data: formData })
      setHasChanges(false)
    } catch {
      // Error handled in hook
    }
  }

  // Test server
  const handleTest = async () => {
    if (!id) return
    setTestResult(null)
    try {
      const result = await testServer.mutateAsync(id)
      setTestResult(result)
    } catch {
      setTestResult({ success: false, message: 'Test failed' })
    }
  }

  // Publish server
  const handlePublish = async () => {
    if (!id) return
    try {
      // Save changes first if any
      if (hasChanges) {
        await updateServer.mutateAsync({ id, data: formData })
        setHasChanges(false)
      }
      await publishServer.mutateAsync(id)
      setConfigCopyDialogOpen(true)
    } catch {
      // Error handled in hook
    }
  }

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

  const availableTools = Array.isArray(tools) ? tools : []

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mcp-servers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{server.name}</h1>
            <p className="text-sm text-muted-foreground">v{server.version}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">
              {t.mcpServers?.configTabs?.basic || 'Basic Info'}
            </TabsTrigger>
            <TabsTrigger value="tools">
              {t.mcpServers?.configTabs?.tools || 'Tools'}
            </TabsTrigger>
            <TabsTrigger value="advanced">
              {t.mcpServers?.configTabs?.advanced || 'Advanced'}
            </TabsTrigger>
            <TabsTrigger value="access">
              {t.mcpServers?.configTabs?.access || 'Access Control'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>{t.mcpServers?.basicInfo?.title || 'Basic Information'}</CardTitle>
                <CardDescription>
                  {t.mcpServers?.basicInfo?.subtitle || 'Configure the basic properties of your MCP server.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.mcpServers?.basicInfo?.name || 'Name'} <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder={t.mcpServers?.basicInfo?.namePlaceholder || 'my-mcp-server'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.mcpServers?.basicInfo?.descriptionLabel || 'Description'}</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder={t.mcpServers?.basicInfo?.descriptionPlaceholder || 'Describe your MCP server...'}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Endpoint & API Key (read-only when published) */}
                {server.status === 'published' && server.endpoint && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>{t.mcpServers?.basicInfo?.endpoint || 'Endpoint'}</Label>
                      <Input value={server.endpoint} readOnly className="font-mono bg-muted" />
                    </div>
                    {server.apiKey && (
                      <div className="space-y-2">
                        <Label>{t.mcpServers?.basicInfo?.apiKey || 'API Key'}</Label>
                        <Input
                          type="password"
                          value={server.apiKey}
                          readOnly
                          className="font-mono bg-muted"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle>{t.mcpServers?.toolsTab?.title || 'Tool Selection'}</CardTitle>
                <CardDescription>
                  {t.mcpServers?.toolsTab?.description || 'Select which tools to expose through this MCP server.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ToolSelector
                  availableTools={availableTools}
                  selectedToolIds={formData.toolIds || []}
                  onChange={(toolIds) => updateFormData('toolIds', toolIds)}
                  isLoading={isLoadingTools}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>{t.mcpServers?.advancedTab?.title || 'Advanced Configuration'}</CardTitle>
                <CardDescription>
                  {t.mcpServers?.advancedTab?.description || 'Configure performance and behavior settings.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConfigPanel
                  config={formData.config || server.config}
                  onChange={(config: McpServerConfig) => updateFormData('config', config)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>{t.mcpServers?.accessTab?.title || 'Access Control'}</CardTitle>
                <CardDescription>
                  {t.mcpServers?.accessTab?.description || 'Configure security and access restrictions.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccessControlPanel
                  accessControl={formData.accessControl || server.accessControl}
                  onChange={(accessControl: McpServerAccessControl) => updateFormData('accessControl', accessControl)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Result */}
        {testResult && (
          <Alert className={testResult.success ? 'border-green-500/50 mt-6' : 'border-destructive/50 mt-6'}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertTitle>
              {testResult.success
                ? (t.mcpServers?.test?.success || 'Test Passed')
                : (t.mcpServers?.test?.failed || 'Test Failed')
              }
            </AlertTitle>
            <AlertDescription>
              {testResult.message}
              {testResult.latency && ` (${testResult.latency}ms)`}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t px-6 py-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testServer.isPending || (formData.toolIds?.length || 0) === 0}
          >
            {testServer.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {t.mcpServers?.actions?.test || 'Test'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleSave} disabled={updateServer.isPending}>
              {updateServer.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t.common?.save || 'Save'}
            </Button>
          )}
          <Button
            onClick={handlePublish}
            disabled={
              publishServer.isPending ||
              (formData.toolIds?.length || 0) === 0 ||
              !formData.name?.trim()
            }
          >
            {publishServer.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            {t.mcpServers?.actions?.publish || 'Publish'}
          </Button>
        </div>
      </div>

      {/* Config Copy Dialog (shown after publish) */}
      <ConfigCopyDialog
        open={configCopyDialogOpen}
        onOpenChange={setConfigCopyDialogOpen}
        server={server}
      />
    </div>
  )
}
