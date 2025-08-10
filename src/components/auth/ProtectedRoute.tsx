"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login')
        return
      }

      if (requiredRole && user.role !== requiredRole) {
        // Si se requiere un rol específico y el usuario no lo tiene
        router.push('/admin')
        return
      }
    }
  }, [user, isLoading, router, requiredRole])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, no renderizar nada (se redirigirá)
  if (!user) {
    return null
  }

  // Si se requiere un rol específico y el usuario no lo tiene, no renderizar nada
  if (requiredRole && user.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}
