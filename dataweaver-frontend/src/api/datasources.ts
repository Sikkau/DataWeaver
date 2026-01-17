import apiClient from './client'
import type {
  DataSource,
  DataSourceFormData,
  TableInfo,
  TestConnectionResult,
  ApiResponse
} from '@/types'

export const dataSourcesApi = {
  // Get all data sources
  list: () =>
    apiClient.get<ApiResponse<DataSource[]>>('/v1/datasources'),

  // Get a single data source by ID
  get: (id: string) =>
    apiClient.get<ApiResponse<DataSource>>(`/v1/datasources/${id}`),

  // Create a new data source
  create: (data: DataSourceFormData) =>
    apiClient.post<ApiResponse<DataSource>>('/v1/datasources', data),

  // Update an existing data source
  update: (id: string, data: Partial<DataSourceFormData>) =>
    apiClient.put<ApiResponse<DataSource>>(`/v1/datasources/${id}`, data),

  // Delete a data source
  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/v1/datasources/${id}`),

  // Test connection to a data source
  testConnection: (id: string) =>
    apiClient.post<ApiResponse<TestConnectionResult>>(`/v1/datasources/${id}/test`),

  // Get list of tables from a data source
  getTables: (id: string) =>
    apiClient.get<ApiResponse<TableInfo[]>>(`/v1/datasources/${id}/tables`),
}
