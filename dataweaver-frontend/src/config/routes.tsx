import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Dashboard, DataSources, Queries, Jobs, Settings, NotFound, Login, Register } from '@/pages'

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
      { path: 'jobs', element: <Jobs /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
