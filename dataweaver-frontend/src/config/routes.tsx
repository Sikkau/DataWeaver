import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Dashboard, DataSources, Queries, Tools, McpServers, McpServerConfigPage, McpServerMonitoringPage, Settings, Chat, NotFound, Login, Register } from '@/pages'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    element: <Register />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'datasources', element: <DataSources /> },
      { path: 'queries', element: <Queries /> },
      { path: 'tools', element: <Tools /> },
      { path: 'mcp-servers', element: <McpServers /> },
      { path: 'mcp-servers/:id/config', element: <McpServerConfigPage /> },
      { path: 'mcp-servers/:id/monitoring', element: <McpServerMonitoringPage /> },
      { path: 'chat', element: <Chat /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
