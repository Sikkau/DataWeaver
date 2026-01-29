import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toolsApi } from '@/api/tools'
import { queriesApi } from '@/api/queries'
import { generateToolDescription } from '@/api/aiGenerate'
import { useModelStore } from '@/stores/useModelStore'
import type { ToolFormData } from '@/types'
import { toast } from 'sonner'

// Query key factory
export const toolKeys = {
  all: ['tools'] as const,
  lists: () => [...toolKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...toolKeys.lists(), filters] as const,
  details: () => [...toolKeys.all, 'detail'] as const,
  detail: (id: string) => [...toolKeys.details(), id] as const,
}

// Get all tools
export function useTools() {
  return useQuery({
    queryKey: toolKeys.lists(),
    queryFn: async () => {
      const response = await toolsApi.list()
      return response.data.data
    },
  })
}

// Get a single tool
export function useTool(id: string | undefined) {
  return useQuery({
    queryKey: id ? toolKeys.detail(id) : ['tools', 'none'],
    queryFn: async () => {
      if (!id) return null
      const response = await toolsApi.get(id)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Create a new tool
export function useCreateTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ToolFormData) => {
      const response = await toolsApi.create(data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: toolKeys.lists() })
      toast.success('Tool 创建成功！')
      return data
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '创建 Tool 失败')
    },
  })
}

// Create tool from query
export function useCreateToolFromQuery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ queryId, data }: { queryId: string; data: { displayName?: string; description?: string; customName?: string } }) => {
      const response = await toolsApi.createFromQuery(queryId, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: toolKeys.lists() })
      toast.success('Tool 创建成功！')
      return data
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '创建 Tool 失败')
    },
  })
}

// Update an existing tool
export function useUpdateTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ToolFormData> }) => {
      const response = await toolsApi.update(id, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: toolKeys.lists() })
      queryClient.invalidateQueries({ queryKey: toolKeys.detail(data.id) })
      toast.success('Tool 更新成功！')
      return data
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '更新 Tool 失败')
    },
  })
}

// Delete a tool
export function useDeleteTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await toolsApi.delete(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toolKeys.lists() })
      toast.success('Tool 删除成功！')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '删除 Tool 失败')
    },
  })
}

// Test a tool
export function useTestTool() {
  return useMutation({
    mutationFn: async ({ id, parameters }: { id: string; parameters: Record<string, unknown> }) => {
      const response = await toolsApi.test(id, parameters)
      return response.data.data
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || '测试 Tool 失败')
    },
  })
}

// Generate description using configured AI model
export function useGenerateDescription() {
  const { provider, apiKey, baseUrl, model, isValidated } = useModelStore()

  return useMutation({
    mutationFn: async ({ queryId }: { queryId: string }) => {
      // Check if model is configured
      if (!isValidated || !apiKey || !model) {
        throw new Error('请先在设置中配置 AI 模型')
      }

      // Fetch query details
      const queryResponse = await queriesApi.get(queryId)
      const query = queryResponse.data.data

      if (!query) {
        throw new Error('Query not found')
      }

      // Generate description using AI
      const description = await generateToolDescription(
        query.name,
        query.sql,
        query.parameters.map(p => ({
          name: p.name,
          type: p.type,
          description: p.description,
        })),
        { provider, apiKey, baseUrl, model }
      )

      return { description, generated: true }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : '生成描述失败'
      toast.error(message)
    },
  })
}
