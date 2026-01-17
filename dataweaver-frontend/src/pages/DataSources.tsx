import { useState } from 'react'
import { Plus, Search, Database, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DataSourceCard,
  DataSourceForm,
  ConnectionTestDialog,
  TableBrowser,
} from '@/components/data-sources'
import {
  useDataSources,
  useCreateDataSource,
  useUpdateDataSource,
  useDeleteDataSource,
  useTestConnection,
  useDataSourceTables,
} from '@/hooks/useDataSources'
import { useI18n } from '@/i18n/I18nContext'
import type { DataSourceFormData, TestConnectionResult } from '@/types'

type ViewMode = 'empty' | 'detail' | 'edit' | 'create' | 'tables'

export function DataSources() {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<ViewMode>('empty')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null)

  // Queries
  const { data: dataSources = [], isLoading, error } = useDataSources()
  const { data: tables = [], isLoading: isLoadingTables } = useDataSourceTables(
    viewMode === 'tables' ? selectedId : undefined
  )

  // Mutations
  const createMutation = useCreateDataSource()
  const updateMutation = useUpdateDataSource()
  const deleteMutation = useDeleteDataSource()
  const testMutation = useTestConnection()

  // Get selected data source
  const selectedDataSource = dataSources.find((ds) => ds.id === selectedId)

  // Filter data sources based on search
  const filteredDataSources = dataSources.filter((ds) =>
    ds.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handlers
  const handleSelectDataSource = (id: string) => {
    setSelectedId(id)
    setViewMode('detail')
  }

  const handleCreate = () => {
    setSelectedId(undefined)
    setViewMode('create')
  }

  const handleEdit = () => {
    setViewMode('edit')
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedId) {
      await deleteMutation.mutateAsync(selectedId)
      setDeleteDialogOpen(false)
      setSelectedId(undefined)
      setViewMode('empty')
    }
  }

  const handleTestConnection = async () => {
    if (!selectedId) return

    setTestDialogOpen(true)
    setTestResult(null)

    try {
      const result = await testMutation.mutateAsync(selectedId)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: t.dataSources.messages.testError,
      })
    }
  }

  const handleViewTables = () => {
    setTestDialogOpen(false)
    setViewMode('tables')
  }

  const handleSubmitCreate = async (data: DataSourceFormData) => {
    const result = await createMutation.mutateAsync(data)
    setSelectedId(result.id)
    setViewMode('detail')
  }

  const handleSubmitUpdate = async (data: DataSourceFormData) => {
    if (!selectedId) return

    const updateData: Partial<DataSourceFormData> = { ...data }
    if (!data.password) {
      updateData.password = undefined
    }

    await updateMutation.mutateAsync({ id: selectedId, data: updateData })
    setViewMode('detail')
  }

  const handleCancel = () => {
    if (selectedId) {
      setViewMode('detail')
    } else {
      setViewMode('empty')
    }
  }

  return (
    <div className="h-full flex gap-6">
      {/* Left Panel - Data Source List (40%) */}
      <div className="w-[40%] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.dataSources.title}</h1>
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t.dataSources.createNew}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.dataSources.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Data Source Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t.dataSources.messages.loadError}: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {!isLoading && !error && dataSources.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t.dataSources.noDataSources}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.dataSources.noDataSourcesDesc}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t.common.create} {t.dataSources.title}
              </Button>
            </div>
          )}

          {/* No Search Results */}
          {!isLoading &&
            !error &&
            dataSources.length > 0 &&
            filteredDataSources.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{t.dataSources.noResults}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.dataSources.noResultsDesc}
                </p>
              </div>
            )}

          {/* Data Source Cards */}
          {!isLoading &&
            !error &&
            filteredDataSources.map((ds) => (
              <DataSourceCard
                key={ds.id}
                dataSource={ds}
                isSelected={ds.id === selectedId}
                onSelect={() => handleSelectDataSource(ds.id)}
                onEdit={() => {
                  setSelectedId(ds.id)
                  handleEdit()
                }}
                onDelete={() => {
                  setSelectedId(ds.id)
                  handleDelete()
                }}
              />
            ))}
        </div>
      </div>

      {/* Right Panel - Detail/Form View (60%) */}
      <div className="flex-1 border-l pl-6">
        {/* Empty State */}
        {viewMode === 'empty' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Database className="h-20 w-20 text-muted-foreground/30 mb-6" />
            <h2 className="text-xl font-semibold mb-2">{t.dataSources.selectOne}</h2>
            <p className="text-muted-foreground mb-6">
              {t.dataSources.selectOneDesc}
            </p>
          </div>
        )}

        {/* Detail View */}
        {viewMode === 'detail' && selectedDataSource && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedDataSource.name}</h2>
                <p className="text-muted-foreground capitalize">
                  {selectedDataSource.type}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestConnection}>
                  {t.dataSources.form.testConnection}
                </Button>
                <Button onClick={handleEdit}>{t.common.edit}</Button>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Connection Info */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">{t.dataSources.details.title}</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground mb-1">{t.dataSources.details.host}</dt>
                    <dd className="font-mono">{selectedDataSource.host}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">{t.dataSources.details.port}</dt>
                    <dd className="font-mono">{selectedDataSource.port}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">{t.dataSources.details.database}</dt>
                    <dd className="font-mono">{selectedDataSource.database}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">{t.dataSources.details.username}</dt>
                    <dd className="font-mono">{selectedDataSource.username}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">{t.dataSources.details.status}</dt>
                    <dd className="capitalize">{selectedDataSource.status}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">{t.dataSources.details.createdAt}</dt>
                    <dd>
                      {new Date(selectedDataSource.createdAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
                {selectedDataSource.description && (
                  <div>
                    <dt className="text-muted-foreground mb-1">{t.dataSources.details.description}</dt>
                    <dd className="text-sm">{selectedDataSource.description}</dd>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setViewMode('tables')}>
                  <Database className="mr-2 h-4 w-4" />
                  {t.dataSources.actions.viewTables}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Form */}
        {viewMode === 'create' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t.common.create} {t.dataSources.title}</h2>
            <DataSourceForm
              onSubmit={handleSubmitCreate}
              onCancel={handleCancel}
              isSubmitting={createMutation.isPending}
            />
          </div>
        )}

        {/* Edit Form */}
        {viewMode === 'edit' && selectedDataSource && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t.common.edit} {t.dataSources.title}</h2>
            <DataSourceForm
              dataSource={selectedDataSource}
              onSubmit={handleSubmitUpdate}
              onCancel={handleCancel}
              onTestConnection={handleTestConnection}
              isSubmitting={updateMutation.isPending}
              isTesting={testMutation.isPending}
            />
          </div>
        )}

        {/* Tables View */}
        {viewMode === 'tables' && selectedDataSource && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedDataSource.name}</h2>
                <p className="text-muted-foreground">{t.dataSources.tables.title}</p>
              </div>
              <Button variant="outline" onClick={() => setViewMode('detail')}>
                {t.dataSources.actions.backToDetail}
              </Button>
            </div>

            <TableBrowser
              tables={tables}
              isLoading={isLoadingTables}
              error={null}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dataSources.messages.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.dataSources.messages.deleteConfirmDesc.replace('{name}', selectedDataSource?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Connection Test Dialog */}
      <ConnectionTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        result={testResult}
        isLoading={testMutation.isPending}
        onViewTables={handleViewTables}
      />
    </div>
  )
}
