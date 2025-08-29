import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Obtener token del header o cookie
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    // Obtener usuario actual
    const user = await AuthService.getCurrentUser(token)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido o expirado'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: { user },
      message: 'Perfil obtenido exitosamente'
    })

  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
