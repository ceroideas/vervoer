"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@prisma/client'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('🔍 ProtectedRoute Debug:', {
      isLoading,
      user: user ? { id: user.id, name: user.name, role: user.role } : null,
      requiredRole
    })

    if (!isLoading) {
      if (!user) {
        console.log('🚫 No hay usuario, redirigiendo a login')
        router.push('/login')
        return
      }

      if (requiredRole && user.role !== requiredRole) {
        console.log('🚫 Rol insuficiente, redirigiendo a admin')
        router.push('/admin')
        return
      }

      console.log('✅ Usuario autenticado correctamente')
    }
  }, [user, isLoading, router, requiredRole])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    console.log('⏳ Mostrando loading...')
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
    console.log('🚫 No hay usuario, no renderizando contenido')
    return null
  }

  // Si se requiere un rol específico y el usuario no lo tiene, no renderizar nada
  if (requiredRole && user.role !== requiredRole) {
    console.log('🚫 Rol insuficiente, no renderizando contenido')
    return null
  }

  console.log('✅ Renderizando contenido protegido')
  return <>{children}</>
}
