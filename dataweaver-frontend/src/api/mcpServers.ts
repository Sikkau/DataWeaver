import apiClient from './client'
import type {
  McpServer,
  McpServerFormData,
  McpServerStats,
  McpServerCallLog,
  McpServerApiResponse,
  McpServerStatsApiResponse,
  McpServerCallLogApiResponse,
  McpConfigExport,
  ApiResponse,
  Tool,
  ToolApiResponse,
} from '@/types'

// Transform backend API response to frontend format
function fromApiFormat(apiData: McpServerApiResponse): McpServer {
  return {
    id: apiData.id,
    name: apiData.name,
    description: apiData.description,
    version: apiData.version,
    status: apiData.status as McpServer['status'],
    endpoint: apiData.endpoint,
    apiKey: apiData.api_key,
    toolIds: apiData.tool_ids || [],
    config: {
      timeout: apiData.config?.timeout || 30,
      rateLimit: apiData.config?.rate_limit || 60,
      logLevel: (apiData.config?.log_level || 'info') as McpServer['config']['logLevel'],
      enableCache: apiData.config?.enable_cache ?? false,
      cacheExpirationMs: apiData.config?.cache_expiration_ms,
    },
    accessControl: {
      apiKeyRequired: apiData.access_control?.api_key_required ?? true,
      allowedOrigins: apiData.access_control?.allowed_origins || [],
      ipWhitelist: apiData.access_control?.ip_whitelist || [],
    },
    publishedAt: apiData.published_at,
    createdAt: apiData.created_at,
    updatedAt: apiData.updated_at,
    tools: apiData.tools?.map(fromToolApiFormat),
  }
}

// Transform Tool API response
function fromToolApiFormat(apiData: ToolApiResponse): Tool {
  return {
    id: apiData.id,
    name: apiData.name,
    displayName: apiData.display_name,
    description: apiData.description,
    queryId: apiData.query_id,
    parameters: apiData.parameters || [],
    outputSchema: apiData.output_schema || {},
    version: apiData.version,
    mcpServerId: apiData.mcp_server_id,
    status: apiData.status as 'active' | 'inactive',
    createdAt: apiData.created_at,
    updatedAt: apiData.updated_at,
    query: apiData.query,
  }
}

// Transform frontend data to backend API format
function toApiFormat(data: McpServerFormData | Partial<McpServerFormData>) {
  return {
    name: data.name,
    description: data.description,
    tool_ids: data.toolIds,
    config: data.config ? {
      timeout: data.config.timeout,
      rate_limit: data.config.rateLimit,
      log_level: data.config.logLevel,
      enable_cache: data.config.enableCache,
      cache_expiration_ms: data.config.cacheExpirationMs,
    } : undefined,
    access_control: data.accessControl ? {
      api_key_required: data.accessControl.apiKeyRequired,
      allowed_origins: data.accessControl.allowedOrigins,
      ip_whitelist: data.accessControl.ipWhitelist,
    } : undefined,
  }
}

// Transform stats API response
function fromStatsApiFormat(apiData: McpServerStatsApiResponse): McpServerStats {
  return {
    totalCalls: apiData.total_calls,
    successRate: apiData.success_rate,
    averageResponseTime: apiData.average_response_time,
    callsToday: apiData.calls_today,
    callsTrend: apiData.calls_trend || [],
    topTools: (apiData.top_tools || []).map(t => ({
      toolName: t.tool_name,
      calls: t.calls,
      avgTime: t.avg_time,
    })),
    responseTimeDistribution: apiData.response_time_distribution || [],
  }
}

// Transform call log API response
function fromCallLogApiFormat(apiData: McpServerCallLogApiResponse): McpServerCallLog {
  return {
    id: apiData.id,
    timestamp: apiData.timestamp,
    toolName: apiData.tool_name,
    status: apiData.status as 'success' | 'error',
    responseTime: apiData.response_time,
    parameters: apiData.parameters,
    errorMessage: apiData.error_message,
  }
}

export const mcpServersApi = {
  // Get all MCP servers
  list: async () => {
    const response = await apiClient.get<ApiResponse<McpServerApiResponse[]>>('/v1/mcp-servers')
    return {
      ...response,
      data: {
        ...response.data,
        data: (response.data.data || []).map(fromApiFormat)
      }
    }
  },

  // Get a single MCP server by ID
  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<McpServerApiResponse>>(`/v1/mcp-servers/${id}`)
    return {
      ...response,
      data: {
        ...response.data,
        data: fromApiFormat(response.data.data)
      }
    }
  },

  // Create a new MCP server
  create: async (data: McpServerFormData) => {
    const response = await apiClient.post<ApiResponse<McpServerApiResponse>>('/v1/mcp-servers', toApiFormat(data))
    return {
      ...response,
      data: {
        ...response.data,
        data: fromApiFormat(response.data.data)
      }
    }
  },

  // Update an existing MCP server
  update: async (id: string, data: Partial<McpServerFormData>) => {
    const response = await apiClient.put<ApiResponse<McpServerApiResponse>>(`/v1/mcp-servers/${id}`, toApiFormat(data))
    return {
      ...response,
      data: {
        ...response.data,
        data: fromApiFormat(response.data.data)
      }
    }
  },

  // Delete an MCP server
  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/v1/mcp-servers/${id}`),

  // Publish an MCP server
  publish: async (id: string) => {
    const response = await apiClient.post<ApiResponse<McpServerApiResponse>>(`/v1/mcp-servers/${id}/publish`)
    return {
      ...response,
      data: {
        ...response.data,
        data: fromApiFormat(response.data.data)
      }
    }
  },

  // Stop an MCP server
  stop: async (id: string) => {
    const response = await apiClient.post<ApiResponse<McpServerApiResponse>>(`/v1/mcp-servers/${id}/stop`)
    return {
      ...response,
      data: {
        ...response.data,
        data: fromApiFormat(response.data.data)
      }
    }
  },

  // Test an MCP server configuration
  test: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string; latency?: number }>>(`/v1/mcp-servers/${id}/test`)
    return response.data.data
  },

  // Get MCP server statistics
  getStatistics: async (id: string) => {
    const response = await apiClient.get<ApiResponse<McpServerStatsApiResponse>>(`/v1/mcp-servers/${id}/statistics`)
    return {
      ...response,
      data: {
        ...response.data,
        data: fromStatsApiFormat(response.data.data)
      }
    }
  },

  // Get MCP server call logs
  getCallLogs: async (id: string, params?: { page?: number; pageSize?: number }) => {
    const response = await apiClient.get<ApiResponse<{ data: McpServerCallLogApiResponse[]; total: number }>>(`/v1/mcp-servers/${id}/logs`, { params })
    return {
      ...response,
      data: {
        ...response.data,
        data: {
          data: (response.data.data.data || []).map(fromCallLogApiFormat),
          total: response.data.data.total
        }
      }
    }
  },

  // Get MCP config export
  getConfigExport: async (id: string) => {
    const response = await apiClient.get<ApiResponse<McpConfigExport>>(`/v1/mcp-servers/${id}/config`)
    return response.data.data
  },

  // Regenerate API key
  regenerateApiKey: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ api_key: string }>>(`/v1/mcp-servers/${id}/regenerate-key`)
    return response.data.data.api_key
  },
}
