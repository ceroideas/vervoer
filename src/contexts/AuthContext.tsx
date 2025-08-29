"use client"
import React, { createContext, useContext, useState, useEffect } from 'react'
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
  const [user, setUser] = useState<UserWithoutPassword | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar autenticación al cargar
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        return true
      } else {
        console.error('Error de login:', data.error)
        return false
      }
    } catch (error) {
      console.error('Error en login:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      setUser(null)
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
