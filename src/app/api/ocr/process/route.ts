import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación usando NextAuth
    const session = await getServerSession(authOptions)
    console.log('🔍 Session debug:', { session, userId: session?.user?.id })
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!session.user.id) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario no disponible en la sesión' },
        { status: 401 }
      )
    }

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    // Crear documento en estado PENDING
    const document = await prisma.document.create({
      data: {
        filename: file.name,
        originalText: '',
        extractedData: {},
        documentType: file.name.toLowerCase().includes('factura') ? 'INVOICE' : 'DELIVERY_NOTE',
        status: 'PENDING',
        processedBy: {
          connect: { id: session.user.id }
        },
        fileSize: file.size,
        fileType: file.type
      }
    })


    // Procesar con GPT-4o mini
    
    // Verificar API key
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY no está configurada')
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY no está configurada' },
        { status: 500 }
      )
    }

    
    // Convertir archivo a base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    
    // Llamar a la API de GPT-4o mini
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
                             {
                 type: 'text',
                 text: `Eres un experto en procesamiento de documentos comerciales. Tu tarea es extraer información estructurada de facturas y albaranes en español.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido que contenga los datos extraídos. No incluyas explicaciones adicionales.

Estructura del JSON esperado:
{
  "documentType": "invoice" o "delivery_note",
  "supplier": {
    "name": "Nombre del proveedor",
    "address": "Dirección del proveedor (si está disponible)",
    "taxId": "CIF/NIF del proveedor (si está disponible)"
  },
  "documentNumber": "Número de factura/albarán",
  "date": "Fecha en formato DD/MM/YYYY",
  "items": [
    {
      "reference": "Código de referencia del producto",
      "description": "Descripción del producto",
      "quantity": número,
      "unitPrice": número (precio unitario sin descuentos),
      "discount": número (descuento aplicado - porcentaje o cantidad),
      "discountType": "percentage" o "amount" (tipo de descuento),
      "totalPrice": número (precio total de la línea con descuentos aplicados)
    }
  ],
  "totals": {
    "subtotal": número (suma de todos los importes, base imponible),
    "discount": número (descuento total del documento si existe),
    "tax": número (IVA),
    "total": número (total final)
  }
}

INSTRUCCIONES ESPECÍFICAS:
1. Busca el nombre del proveedor cerca de palabras como "PROVEEDOR", "EMISOR", "VENDEDOR", "EMPRESA"
2. El número de documento puede aparecer como "FACTURA Nº", "ALBARÁN Nº", etc.
3. La fecha puede estar en formato DD/MM/YYYY, DD-MM-YYYY, o similar
4. Para los productos, identifica líneas que contengan: referencia, descripción, cantidad, precio unitario, descuento, importe
5. Los precios unitarios deben ser el precio SIN descuentos aplicados
6. Los descuentos pueden aparecer como:
   - Porcentaje: "10%", "15% dto", "descuento 20%"
   - Cantidad: "5€ dto", "descuento 10€", "-5€"
7. El totalPrice debe ser el precio final CON descuentos aplicados
8. Busca descuentos totales del documento en secciones como "DESCUENTO TOTAL", "DTOS. TOTALES"
9. La base imponible es la suma de todos los importes de productos
10. El total es la base imponible + IVA
11. Si algún dato no está disponible, usa null o string vacío
12. Los números deben ser números, no strings
13. Maneja correctamente los separadores decimales (comas y puntos)`
               },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${file.type};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })
    })

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text()
      console.error('❌ Error en GPT-4o mini:', gptResponse.status, gptResponse.statusText)
      console.error('❌ Detalles del error:', errorText)
      
      // Actualizar documento con error
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: 'ERROR',
          holdedError: `Error en GPT-4o mini: ${gptResponse.status} ${gptResponse.statusText}`
        }
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Error en GPT-4o mini: ${gptResponse.status} ${gptResponse.statusText}`,
          details: errorText
        },
        { status: gptResponse.status }
      )
    }

    const gptData = await gptResponse.json()

    // Extraer el JSON de la respuesta
    let extractedData
    try {
      const content = gptData.choices[0]?.message?.content
      if (!content) {
        throw new Error('No se recibió contenido de GPT-4o mini')
      }

      // Buscar JSON en la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No se encontró JSON en la respuesta')
      }

      extractedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('❌ Error parseando respuesta de GPT:', parseError)
      
      // Actualizar documento con error
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: 'ERROR',
          holdedError: `Error parseando respuesta: ${parseError}`
        }
      })
      
      return NextResponse.json(
        { success: false, error: 'Error parseando respuesta de GPT-4o mini' },
        { status: 500 }
      )
    }

    // Buscar o crear proveedor
    let supplier = null
    if (extractedData.supplier?.name) {
      // Primero buscar si ya existe un proveedor con ese nombre
      supplier = await prisma.supplier.findFirst({
        where: { name: extractedData.supplier.name }
      })
      
      // Si no existe, crear uno nuevo
      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            name: extractedData.supplier.name,
            address: extractedData.supplier.address || null,
            taxId: extractedData.supplier.taxId || null,
            isActive: true
          }
        })
      }
    }

    // Función para parsear fecha
    const parseDate = (dateString: string): Date | null => {
      if (!dateString) return null
      
      try {
        // Intentar diferentes formatos de fecha
        const formats = [
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
          /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
          /^(\d{1,2})-(\d{1,2})-(\d{4})$/    // DD-MM-YYYY
        ]
        
        for (const format of formats) {
          const match = dateString.match(format)
          if (match) {
            if (format.source.includes('YYYY')) {
              // Formato YYYY-MM-DD
              return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
            } else {
              // Formato DD/MM/YYYY o DD-MM-YYYY
              return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
            }
          }
        }
        
        // Si no coincide con ningún formato, intentar con new Date()
        const date = new Date(dateString)
        return isNaN(date.getTime()) ? null : date
      } catch (error) {
        return null
      }
    }

    // Actualizar documento con datos extraídos
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        originalText: gptData.choices[0]?.message?.content || '',
        extractedData: extractedData as any, // Cast para compatibilidad con Prisma JSON
        status: 'PROCESSED',
        supplierId: supplier?.id,
        documentNumber: extractedData.documentNumber,
        documentDate: parseDate(extractedData.date),
        subtotal: extractedData.totals?.subtotal || 0,
        taxAmount: extractedData.totals?.tax || 0, // Cambiado de taxAmount a tax
        totalAmount: extractedData.totals?.total || 0
      }
    })

    // Crear items del documento
    if (extractedData.items && Array.isArray(extractedData.items)) {
      for (const item of extractedData.items) {
        await prisma.documentItem.create({
          data: {
            reference: item.reference || '',
            description: item.description || '',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            total: item.totalPrice || 0,
            documentId: document.id
          }
        })
      }
    }



    return NextResponse.json({
      success: true,
      data: {
        document: updatedDocument,
        extractedData: extractedData
      },
      message: 'Documento procesado correctamente'
    })

  } catch (error) {
    console.error('❌ Error en procesamiento:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
