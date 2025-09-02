"use client"
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { UserWithoutPassword } from '@/types/database'

interface AuthContextType {
  user: UserWithoutPassword | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserWithoutPassword | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar autenticación al cargar
  const checkAuth = async () => {
    if (status === 'loading') return
    
    if (session?.user) {
      // Convertir la sesión de NextAuth al formato que espera la app
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as 'ADMIN' | 'USER' | 'VIEWER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } else {
      setUser(null)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [session, status])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        console.error('❌ Error de login:', result.error)
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Error en login:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut({ redirect: false })
      setUser(null)
    } catch (error) {
      console.error('❌ Error en logout:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
