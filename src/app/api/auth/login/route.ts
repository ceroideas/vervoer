import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { LoginCredentials } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const body: LoginCredentials = await req.json()
    const { email, password } = body

    // Validar datos de entrada
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    // Intentar login
    const authResponse = await AuthService.login({ email, password })

    if (!authResponse) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales inválidas'
      }, { status: 401 })
    }

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: authResponse.user,
        token: authResponse.token
      },
      message: 'Login exitoso'
    })

    // Establecer cookie de autenticación
    response.cookies.set('auth-token', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    })

    return response

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
