import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm font-semibold text-slate-500">
          Перевірка сесії...
        </p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}