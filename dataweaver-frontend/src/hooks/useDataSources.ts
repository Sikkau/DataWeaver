import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dataSourcesApi } from '@/api/datasources'
import type { DataSourceFormData } from '@/types'
import { toast } from 'sonner'

// Query key factory
export const dataSourceKeys = {
  all: ['datasources'] as const,
  lists: () => [...dataSourceKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...dataSourceKeys.lists(), filters] as const,
  details: () => [...dataSourceKeys.all, 'detail'] as const,
  detail: (id: string) => [...dataSourceKeys.details(), id] as const,
  tables: (id: string) => [...dataSourceKeys.detail(id), 'tables'] as const,
}

// Get all data sources
export function useDataSources() {
  return useQuery({
    queryKey: dataSourceKeys.lists(),
    queryFn: async () => {
      const response = await dataSourcesApi.list()
      return response.data.data
    },
  })
}

// Get a single data source
export function useDataSource(id: string | undefined) {
  return useQuery({
    queryKey: id ? dataSourceKeys.detail(id) : ['datasources', 'none'],
    queryFn: async () => {
      if (!id) return null
      const response = await dataSourcesApi.get(id)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Create a new data source
export function useCreateDataSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DataSourceFormData) => {
      const response = await dataSourcesApi.create(data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dataSourceKeys.lists() })
      toast.success('数据源创建成功！')
      return data
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建数据源失败')
    },
  })
}

// Update an existing data source
export function useUpdateDataSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DataSourceFormData> }) => {
      const response = await dataSourcesApi.update(id, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dataSourceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dataSourceKeys.detail(data.id) })
      toast.success('数据源更新成功！')
      return data
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新数据源失败')
    },
  })
}

// Delete a data source
export function useDeleteDataSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await dataSourcesApi.delete(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataSourceKeys.lists() })
      toast.success('数据源删除成功！')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除数据源失败')
    },
  })
}

// Test connection to a data source
export function useTestConnection() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await dataSourcesApi.testConnection(id)
      return response.data.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || '连接测试成功！')
      } else {
        toast.error(data.message || '连接测试失败')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '连接测试失败')
    },
  })
}

// Get tables from a data source
export function useDataSourceTables(id: string | undefined) {
  return useQuery({
    queryKey: id ? dataSourceKeys.tables(id) : ['datasources', 'none', 'tables'],
    queryFn: async () => {
      if (!id) return []
      const response = await dataSourcesApi.getTables(id)
      return response.data.data
    },
    enabled: !!id,
  })
}
