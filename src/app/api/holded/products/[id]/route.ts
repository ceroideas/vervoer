import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function GET(
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

    // Buscar producto por ID
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { product }
    })

  } catch (error) {
    console.error('Error obteniendo producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
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

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: body,
      include: {
        supplier: true,
        items: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { product: updatedProduct }
    })

  } catch (error) {
    console.error('Error actualizando producto:', error)
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

    // Eliminar producto
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente'
    })

  } catch (error) {
    console.error('Error eliminando producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
