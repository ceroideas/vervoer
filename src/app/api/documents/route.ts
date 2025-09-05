import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { CreateDocumentData, DocumentFilters } from '@/types/database'

// GET - Obtener lista de documentos
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación usando NextAuth
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const documentType = searchParams.get('documentType')
    const supplierId = searchParams.get('supplierId')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Construir filtros
    const where: any = {
      userId: session.user.id // Solo documentos del usuario autenticado
    }

    if (status) where.status = status
    if (documentType) where.documentType = documentType
    if (supplierId) where.supplierId = supplierId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Obtener documentos con relaciones
    const documents = await prisma.document.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Obtener total de documentos
    const total = await prisma.document.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error obteniendo documentos:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// POST - Crear nuevo documento
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación usando NextAuth
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    const body: CreateDocumentData = await req.json()
    
    const { filename, originalText, extractedData, documentType, fileSize, fileType, processingTime } = body

    // Validar datos requeridos
    if (!filename || !originalText || !extractedData || !documentType) {
      return NextResponse.json({
        success: false,
        error: 'Datos requeridos faltantes'
      }, { status: 400 })
    }

    // Procesar proveedor si existe
    let supplierId: string | undefined
    if (extractedData.supplier?.name) {
      // Buscar proveedor existente o crear uno nuevo
      let supplier = await prisma.supplier.findFirst({
        where: {
          OR: [
            { name: { equals: extractedData.supplier.name, mode: 'insensitive' } },
            { taxId: extractedData.supplier.taxId }
          ]
        }
      })

      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            name: extractedData.supplier.name,
            taxId: extractedData.supplier.taxId,
            address: extractedData.supplier.address
          }
        })
      }

      supplierId = supplier.id
    }

    // Crear documento
    const document = await prisma.document.create({
      data: {
        filename,
        originalText,
        extractedData: extractedData as any, // Cast para compatibilidad con Prisma JSON
        documentType,
        userId: session.user.id,
        supplierId,
        documentNumber: extractedData.documentNumber,
        documentDate: extractedData.date ? new Date(extractedData.date) : null,
        subtotal: extractedData.totals.subtotal || 0,
        taxAmount: extractedData.totals.tax || 0,
        totalAmount: extractedData.totals.total || 0,
        fileSize,
        fileType,
        processingTime,
        status: 'PROCESSED'
      },
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

    // Crear items del documento
    if (extractedData.items && extractedData.items.length > 0) {
      const itemsData = extractedData.items.map(item => ({
        reference: item.reference || '',
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        documentId: document.id
      }))

      await prisma.documentItem.createMany({
        data: itemsData
      })
    }

    // Obtener documento con items
    const documentWithItems = await prisma.document.findUnique({
      where: { id: document.id },
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
      data: { document: documentWithItems },
      message: 'Documento creado exitosamente'
    })

  } catch (error) {
    console.error('Error creando documento:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
