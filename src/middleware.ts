import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthService } from '@/lib/auth'

// Rutas que requieren autenticación
const protectedRoutes = [
  '/admin',
  '/api/documents',
  '/api/suppliers',
  '/api/users',
  '/api/auth/profile'
]

// Rutas públicas
const publicRoutes = [
  '/login',
  '/api/auth/login',
  '/api/auth/register'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Obtener token del header Authorization o cookie
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Si es una ruta protegida y no hay token, redirigir a login
  if (isProtectedRoute && !token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si es una ruta de login y ya hay token, redirigir a admin
  if (isPublicRoute && token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Para rutas de API protegidas, verificar token
  if (isProtectedRoute && token && pathname.startsWith('/api/')) {
    try {
      const payload = AuthService.verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
