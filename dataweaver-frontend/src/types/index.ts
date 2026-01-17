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
export interface Query extends BaseEntity {
  name: string
  dataSourceId: string
  sql: string
  description?: string
}

// Job types
export interface Job extends BaseEntity {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  schedule?: string
  lastRunAt?: string
  nextRunAt?: string
}
