import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo manejar rutas de páginas, no APIs
  // Las APIs manejan su propia autenticación con NextAuth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Para páginas protegidas, redirigir al login si no está autenticado
  const protectedPages = ['/admin']
  
  if (protectedPages.some(page => pathname.startsWith(page))) {
    // Verificar si hay cookies de NextAuth
    const sessionToken = request.cookies.get('next-auth.session-token')?.value
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url))
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
