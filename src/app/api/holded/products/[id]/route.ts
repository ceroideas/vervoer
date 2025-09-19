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
      // Obtener producto de Holded
      const product = await holdedClient.getProduct(id)
      
      return NextResponse.json({
        success: true,
        data: { product }
      })

    } catch (holdedError: any) {
      console.error('Error obteniendo producto de Holded:', holdedError)
      
      // Si el producto no existe en Holded, retornar error apropiado
      if (holdedError.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Producto no encontrado en Holded' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Error obteniendo producto de Holded' },
        { status: 500 }
      )
    }

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

    // Preparar datos para actualizar en Holded según su API
    const holdedUpdateData: any = {
      kind: 'simple' // Campo obligatorio según Holded
    }

    // Mapear campos del frontend a campos de Holded
    if (body.name !== undefined) holdedUpdateData.name = body.name
    if (body.description !== undefined) holdedUpdateData.desc = body.description
    if (body.sku !== undefined) holdedUpdateData.sku = body.sku
    if (body.price !== undefined) holdedUpdateData.price = body.price ? parseFloat(body.price) : 0
    if (body.cost !== undefined) {
      holdedUpdateData.cost = body.cost ? parseFloat(body.cost) : 0
      holdedUpdateData.calculatecost = body.cost ? parseFloat(body.cost) : 0
      holdedUpdateData.purchasePrice = body.cost ? parseFloat(body.cost) : 0
    }
    if (body.stock !== undefined) holdedUpdateData.stock = body.stock ? parseInt(body.stock) : 0
    if (body.weight !== undefined) holdedUpdateData.weight = body.weight ? parseFloat(body.weight) : 0
    if (body.tax !== undefined) holdedUpdateData.tax = body.tax ? parseFloat(body.tax) : 0
    if (body.barcode !== undefined) holdedUpdateData.barcode = body.barcode || ''
    if (body.tags !== undefined) {
      // Convertir string de tags separados por comas a array
      holdedUpdateData.tags = body.tags ? 
        body.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : 
        []
    }

    try {
      // Actualizar producto en Holded
      const updatedProduct = await holdedClient.updateProduct(id, holdedUpdateData)
      
      return NextResponse.json({
        success: true,
        data: { product: updatedProduct },
        message: 'Producto actualizado exitosamente en Holded'
      })

    } catch (holdedError: any) {
      console.error('Error actualizando producto en Holded:', holdedError)
      
      // Si el producto no existe en Holded, retornar error apropiado
      if (holdedError.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Producto no encontrado en Holded' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Error actualizando producto en Holded' },
        { status: 500 }
      )
    }

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
