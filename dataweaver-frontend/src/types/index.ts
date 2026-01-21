// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Common entity types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// User types
export interface User extends BaseEntity {
  email: string
  name: string
  avatar?: string
}

// Auth types
export * from './auth'

// DataSource types
export type DataSourceType = 'mysql' | 'postgresql' | 'sqlserver' | 'oracle'
export type DataSourceStatus = 'active' | 'inactive' | 'error'

export interface DataSource extends BaseEntity {
  name: string
  type: DataSourceType
  host: string
  port: number
  database: string
  username: string
  password?: string // Only returned when explicitly requested
  status: DataSourceStatus
  description?: string
}

export interface DataSourceFormData {
  name: string
  type: DataSourceType
  host: string
  port: number
  database: string
  username: string
  password: string
  description?: string
}

export interface TestConnectionResult {
  success: boolean
  message: string
  latency?: number
}

export interface TableInfo {
  name: string
  schema?: string
  rowCount?: number
  columns?: ColumnInfo[]
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
}

// Query types
export type QueryParameterType = 'string' | 'number' | 'boolean' | 'date'

export interface QueryParameter {
  id: string
  name: string
  type: QueryParameterType
  required: boolean
  defaultValue?: string
  description?: string
}

export interface Query extends BaseEntity {
  name: string
  dataSourceId: string
  sql: string
  description?: string
  parameters: QueryParameter[]
}

export interface QueryFormData {
  name: string
  dataSourceId: string
  sql: string
  description?: string
  parameters: QueryParameter[]
}

export interface QueryExecuteParams {
  queryId: string
  parameters: Record<string, unknown>
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
}

// Backend API response format for query execution
export interface QueryExecuteApiResponse {
  columns: string[]
  data: Record<string, unknown>[]
  row_count: number
  execution_time_ms: number
}

export interface QueryHistory {
  id: string
  queryId: string
  queryName: string
  parameters: Record<string, unknown>
  status: 'success' | 'error'
  rowCount?: number
  executionTime?: number
  errorMessage?: string
  createdAt: string
}

// Backend API response format for query history
export interface QueryHistoryApiResponse {
  id: string
  query_id: string
  query_name?: string
  parameters: Record<string, unknown>
  row_count: number
  execution_time_ms: number
  status: string
  error_message?: string
  created_at: string
}

// Job types
export interface Job extends BaseEntity {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  schedule?: string
  lastRunAt?: string
  nextRunAt?: string
}

// Tool types
export type ToolParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'datetime'

export interface ToolParameter {
  name: string
  type: ToolParameterType
  required: boolean
  default?: unknown
  description: string
  format?: string
}

export interface Tool extends BaseEntity {
  name: string
  displayName: string
  description: string
  queryId: string
  parameters: ToolParameter[]
  outputSchema: Record<string, unknown>
  version: number
  mcpServerId?: string
  status: 'active' | 'inactive'
  query?: {
    id: string
    name: string
    description: string
  }
}

export interface ToolFormData {
  name: string
  displayName: string
  description: string
  queryId: string
  parameters: ToolParameter[]
  outputSchema: Record<string, unknown>
}

export interface ToolTestResult {
  success: boolean
  message: string
  executionTimeMs: number
  rowCount: number
  data?: Record<string, unknown>[]
  columns?: string[]
}

// Backend API response formats for Tool
export interface ToolApiResponse {
  id: string
  user_id: number
  name: string
  display_name: string
  description: string
  query_id: string
  parameters: ToolParameter[]
  output_schema: Record<string, unknown>
  version: number
  mcp_server_id?: string
  status: string
  created_at: string
  updated_at: string
  query?: {
    id: string
    name: string
    description: string
  }
}

export interface ToolTestApiResponse {
  success: boolean
  message: string
  execution_time_ms: number
  row_count: number
  data?: Record<string, unknown>[]
  columns?: string[]
}

// MCP Server types
export type McpServerStatus = 'draft' | 'published' | 'stopped' | 'error'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface McpServerConfig {
  timeout: number // seconds
  rateLimit: number // requests per minute
  logLevel: LogLevel
  enableCache: boolean
  cacheExpirationMs?: number
}

export interface McpServerAccessControl {
  apiKeyRequired: boolean
  allowedOrigins: string[]
  ipWhitelist: string[]
}

export interface McpServer extends BaseEntity {
  name: string
  description: string
  version: string
  status: McpServerStatus
  endpoint?: string
  apiKey?: string
  toolIds: string[]
  config: McpServerConfig
  accessControl: McpServerAccessControl
  publishedAt?: string
  tools?: Tool[]
}

export interface McpServerFormData {
  name: string
  description: string
  toolIds: string[]
  config: McpServerConfig
  accessControl: McpServerAccessControl
}

// MCP Server Statistics
export interface McpServerStats {
  totalCalls: number
  successRate: number
  averageResponseTime: number
  callsToday: number
  callsTrend: CallTrendData[]
  topTools: TopToolData[]
  responseTimeDistribution: ResponseTimeData[]
}

export interface CallTrendData {
  date: string
  calls: number
  success: number
  errors: number
}

export interface TopToolData {
  toolName: string
  calls: number
  avgTime: number
}

export interface ResponseTimeData {
  range: string
  count: number
  [key: string]: string | number
}

export interface McpServerCallLog {
  id: string
  timestamp: string
  toolName: string
  status: 'success' | 'error'
  responseTime: number
  parameters?: Record<string, unknown>
  errorMessage?: string
}

// Backend API response formats for MCP Server
export interface McpServerApiResponse {
  id: string
  user_id: number
  name: string
  description: string
  version: string
  status: string
  endpoint?: string
  api_key?: string
  tool_ids: string[]
  config: {
    timeout: number
    rate_limit: number
    log_level: string
    enable_cache: boolean
    cache_expiration_ms?: number
  }
  access_control: {
    api_key_required: boolean
    allowed_origins: string[]
    ip_whitelist: string[]
  }
  published_at?: string
  created_at: string
  updated_at: string
  tools?: ToolApiResponse[]
}

export interface McpServerStatsApiResponse {
  total_calls: number
  success_rate: number
  average_response_time: number
  calls_today: number
  calls_trend: {
    date: string
    calls: number
    success: number
    errors: number
  }[]
  top_tools: {
    tool_name: string
    calls: number
    avg_time: number
  }[]
  response_time_distribution: {
    range: string
    count: number
  }[]
}

export interface McpServerCallLogApiResponse {
  id: string
  timestamp: string
  tool_name: string
  status: string
  response_time: number
  parameters?: Record<string, unknown>
  error_message?: string
}

// MCP Config Export format
export interface McpConfigExport {
  mcpServers: {
    [key: string]: {
      command: string
      args: string[]
      env: {
        DATAWEAVER_ENDPOINT: string
        DATAWEAVER_API_KEY: string
        [key: string]: string
      }
    }
  }
}
