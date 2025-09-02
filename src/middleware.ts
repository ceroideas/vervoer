import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Para todas las rutas de API, verificar autenticación
  if (pathname.startsWith('/api/')) {
    // Obtener token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value
    
    // Si es una ruta protegida y no hay token
    if ((pathname.startsWith('/api/documents') || 
         pathname.startsWith('/api/suppliers') || 
         pathname.startsWith('/api/users')) && !token) {
      return NextResponse.json(
        { error: 'No autorizado' },
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
