import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// GET - Obtener documento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación usando NextAuth
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    const { id } = params

    // Obtener documento con relaciones
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({
        success: false,
        error: 'Documento no encontrado'
      }, { status: 404 })
    }

    // Verificar que el usuario tenga acceso al documento
    if (document.userId !== session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Acceso denegado'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error) {
    console.error('Error obteniendo documento:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const currentUser = await AuthService.getCurrentUser(token)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Actualizar documento
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: body,
      include: {
        supplier: true,
        items: true,
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { document: updatedDocument }
    })

  } catch (error) {
    console.error('Error actualizando documento:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const currentUser = await AuthService.getCurrentUser(token)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Eliminar documento
    await prisma.document.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado correctamente'
    })

  } catch (error) {
    console.error('Error eliminando documento:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
