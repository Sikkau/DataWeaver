import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAppStore()
  const location = useLocation()

  // Check for token in localStorage as backup
  const token = localStorage.getItem('token')

  // If no user in store and no token, redirect to login
  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
