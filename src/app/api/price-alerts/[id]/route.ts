import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

// Eliminar alerta de precio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que la alerta existe
    const existingAlert = await prisma.priceVariation.findUnique({
      where: { id }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { success: false, error: 'Alerta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la alerta
    await prisma.priceVariation.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Alerta eliminada correctamente'
    })

  } catch (error) {
    console.error('Error eliminando alerta:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Marcar alerta como procesada
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que la alerta existe
    const existingAlert = await prisma.priceVariation.findUnique({
      where: { id }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { success: false, error: 'Alerta no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar la alerta
    const updatedAlert = await prisma.priceVariation.update({
      where: { id },
      data: {
        isProcessed: body.isProcessed ?? true,
        notes: body.notes
      }
    })

    return NextResponse.json({
      success: true,
      data: { alert: updatedAlert },
      message: 'Alerta actualizada correctamente'
    })

  } catch (error) {
    console.error('Error actualizando alerta:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
