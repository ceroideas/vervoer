"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor completa todos los campos')
      return
    }

    const success = await login(email, password)
    
    if (success) {
      router.push('/admin')
    } else {
      setError('Credenciales incorrectas')
    }
  }

  const handleDemoLogin = async (type: 'admin' | 'user') => {
    const demoCredentials = type === 'admin' 
      ? { email: 'admin@vervoer.com', password: 'admin123' }
      : { email: 'user@vervoer.com', password: 'user123' }
    
    setEmail(demoCredentials.email)
    setPassword(demoCredentials.password)
    
    const success = await login(demoCredentials.email, demoCredentials.password)
    if (success) {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vervoer</h1>
          <p className="text-gray-600">Inicia sesión en tu cuenta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo de email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="tu@email.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo de contraseña */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botón de login */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Botones de demo */}
            <div className="mt-6 space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">O prueba con una cuenta demo:</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('admin')}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Admin Demo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('user')}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    User Demo
                  </Button>
                </div>
              </div>
            </div>

            {/* Información de credenciales */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Credenciales de prueba:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Admin:</strong> admin@vervoer.com / admin123</p>
                <p><strong>Usuario:</strong> user@vervoer.com / user123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link de regreso */}
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
