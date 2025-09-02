import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    
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

    // Obtener historial de precios del producto
    const priceHistory = await prisma.productPriceHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limitar a los últimos 100 registros
    })

    return NextResponse.json({
      success: true,
      data: { priceHistory }
    })

  } catch (error) {
    console.error('Error obteniendo historial de precios:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
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

    // Crear nuevo registro en el historial de precios
    const newPriceRecord = await prisma.productPriceHistory.create({
      data: {
        productId,
        price: body.price,
        cost: body.cost || 0,
        documentNumber: body.documentNumber || '',
        documentDate: body.documentDate ? new Date(body.documentDate) : new Date(),
        supplierName: body.supplierName || '',
        quantity: body.quantity || 0,
        totalAmount: body.totalAmount || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: { priceRecord: newPriceRecord }
    })

  } catch (error) {
    console.error('Error creando registro de precio:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    
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

    // Eliminar todo el historial de precios del producto
    await prisma.productPriceHistory.deleteMany({
      where: { productId }
    })

    return NextResponse.json({
      success: true,
      message: 'Historial de precios eliminado correctamente'
    })

  } catch (error) {
    console.error('Error eliminando historial de precios:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
