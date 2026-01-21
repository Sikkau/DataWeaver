import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mcpServersApi } from '@/api/mcpServers'
import type { McpServerFormData } from '@/types'
import { toast } from 'sonner'

// Query key factory
export const mcpServerKeys = {
  all: ['mcpServers'] as const,
  lists: () => [...mcpServerKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...mcpServerKeys.lists(), filters] as const,
  details: () => [...mcpServerKeys.all, 'detail'] as const,
  detail: (id: string) => [...mcpServerKeys.details(), id] as const,
  stats: (id: string) => [...mcpServerKeys.all, 'stats', id] as const,
  logs: (id: string, params?: Record<string, unknown>) => [...mcpServerKeys.all, 'logs', id, params] as const,
}

// Get all MCP servers
export function useMcpServers() {
  return useQuery({
    queryKey: mcpServerKeys.lists(),
    queryFn: async () => {
      const response = await mcpServersApi.list()
      return response.data.data
    },
  })
}

// Get a single MCP server
export function useMcpServer(id: string | undefined) {
  return useQuery({
    queryKey: id ? mcpServerKeys.detail(id) : ['mcpServers', 'none'],
    queryFn: async () => {
      if (!id) return null
      const response = await mcpServersApi.get(id)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Create a new MCP server
export function useCreateMcpServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: McpServerFormData) => {
      const response = await mcpServersApi.create(data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.lists() })
      toast.success('MCP Server 创建成功！')
      return data
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '创建 MCP Server 失败')
    },
  })
}

// Update an existing MCP server
export function useUpdateMcpServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<McpServerFormData> }) => {
      const response = await mcpServersApi.update(id, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.detail(data.id) })
      toast.success('MCP Server 更新成功！')
      return data
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '更新 MCP Server 失败')
    },
  })
}

// Delete an MCP server
export function useDeleteMcpServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await mcpServersApi.delete(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.lists() })
      toast.success('MCP Server 删除成功！')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '删除 MCP Server 失败')
    },
  })
}

// Publish an MCP server
export function usePublishMcpServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await mcpServersApi.publish(id)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.detail(data.id) })
      toast.success('MCP Server 发布成功！')
      return data
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '发布 MCP Server 失败')
    },
  })
}

// Stop an MCP server
export function useStopMcpServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await mcpServersApi.stop(id)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.detail(data.id) })
      toast.success('MCP Server 已停止')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '停止 MCP Server 失败')
    },
  })
}

// Test an MCP server
export function useTestMcpServer() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await mcpServersApi.test(id)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '测试 MCP Server 失败')
    },
  })
}

// Get MCP server statistics with polling
export function useMcpServerStats(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: id ? mcpServerKeys.stats(id) : ['mcpServers', 'stats', 'none'],
    queryFn: async () => {
      if (!id) return null
      const response = await mcpServersApi.getStatistics(id)
      return response.data.data
    },
    enabled: !!id && enabled,
    refetchInterval: 30000, // 30 seconds polling
  })
}

// Get MCP server call logs
export function useMcpServerLogs(id: string | undefined, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: id ? mcpServerKeys.logs(id, params) : ['mcpServers', 'logs', 'none'],
    queryFn: async () => {
      if (!id) return { data: [], total: 0 }
      const response = await mcpServersApi.getCallLogs(id, params)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Get MCP config export
export function useGetMcpConfigExport() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await mcpServersApi.getConfigExport(id)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '获取配置失败')
    },
  })
}

// Regenerate API key
export function useRegenerateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await mcpServersApi.regenerateApiKey(id)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mcpServerKeys.detail(id) })
      toast.success('API Key 已重新生成')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '重新生成 API Key 失败')
    },
  })
}
