import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Obtener token del header o cookie
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value

    if (token) {
      // Eliminar sesión de la base de datos
      await AuthService.logout(token)
    }

    // Crear respuesta
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    })

    // Eliminar cookie de autenticación
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    return response

  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
