import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { HoldedClient } from '@/holded/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar autenticación usando NextAuth
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Buscar producto por ID
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
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
    
    // Verificar autenticación usando NextAuth
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: body,
      include: {
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
    
    // Verificar autenticación usando NextAuth
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar API key de Holded
    const holdedApiKey = process.env.HOLDED_API_KEY
    if (!holdedApiKey) {
      return NextResponse.json(
        { success: false, error: 'HOLDED_API_KEY no está configurada' },
        { status: 500 }
      )
    }

    // Crear cliente de Holded
    const holdedClient = new HoldedClient({ apiKey: holdedApiKey })

    try {
      // Eliminar producto de Holded
      await holdedClient.deleteProduct(id)
      
      // Opcional: También eliminar de la base de datos local si existe
      try {
        await prisma.product.delete({
          where: { id }
        })
      } catch (dbError) {
        // Si no existe en la base de datos local, no es un error crítico
        console.log('Producto no encontrado en base de datos local:', id)
      }

      return NextResponse.json({
        success: true,
        message: 'Producto eliminado correctamente de Holded'
      })

    } catch (holdedError: any) {
      console.error('Error eliminando producto de Holded:', holdedError)
      
      // Si el producto no existe en Holded, retornar error apropiado
      if (holdedError.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Producto no encontrado en Holded' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Error eliminando producto de Holded' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error eliminando producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
