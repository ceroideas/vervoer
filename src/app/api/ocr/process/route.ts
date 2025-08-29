import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { DocumentType } from '@prisma/client';

interface ExtractedData {
  documentType: 'invoice' | 'delivery_note';
  documentNumber?: string;
  date?: string;
  supplier?: {
    name?: string;
    address?: string;
    taxId?: string;
  };
  items?: Array<{
    reference?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    discount?: number;
    discountType?: 'percentage' | 'amount';
    totalPrice?: number;
  }>;
  totals?: {
    subtotal?: number;
    discount?: number;
    tax?: number;
    total?: number;
  };
}

function extractDataFromText(text: string): ExtractedData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const extracted: ExtractedData = {
    documentType: text.toLowerCase().includes('factura') ? 'invoice' : 'delivery_note',
    items: [],
    totals: {}
  };

  // Extraer número de documento
  const documentNumberMatch = text.match(/(?:FACTURA|ALBARÁN|ALBARAN)\s*(?:Nº?|NÚMERO?|NUMERO?)?\s*:?\s*([A-Z0-9\-_\/]+)/i);
  if (documentNumberMatch) {
    extracted.documentNumber = documentNumberMatch[1];
  }

  // Extraer fecha
  const dateMatch = text.match(/(?:FECHA|DATE)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) {
    extracted.date = dateMatch[1];
  }

  // Extraer proveedor
  const supplierKeywords = ['PROVEEDOR', 'EMISOR', 'VENDEDOR', 'EMPRESA', 'COMPAÑÍA', 'COMPAÑIA'];
  for (const keyword of supplierKeywords) {
    const supplierMatch = text.match(new RegExp(`${keyword}\\s*:?\\s*([^\\n]+)`, 'i'));
    if (supplierMatch) {
      extracted.supplier = { name: supplierMatch[1].trim() };
      break;
    }
  }

  // Extraer productos
  const itemLines = lines.filter(line => {
    const hasNumbers = /\d+/.test(line);
    const hasPrice = /[€$]?\s*\d+[,.]?\d*/.test(line);
    const isNotHeader = !line.match(/^(FACTURA|ALBARÁN|ALBARAN|TOTAL|SUBTOTAL|IVA)/i);
    return hasNumbers && (hasPrice || isNotHeader) && line.length > 10;
  });

  for (const line of itemLines.slice(0, 10)) {
    const item: any = {};
    
    // Extraer cantidad
    const quantityMatch = line.match(/(\d+(?:[,.]\d+)?)\s*(?:x|un|ud|pcs?)/i);
    if (quantityMatch) {
      item.quantity = parseFloat(quantityMatch[1].replace(',', '.'));
    }

    // Extraer precio unitario
    const unitPriceMatch = line.match(/[€$]?\s*(\d+(?:[,.]\d+)?)\s*[€$]?/g);
    if (unitPriceMatch && unitPriceMatch.length >= 2) {
      const unitPrice = unitPriceMatch[0].replace(/[€$\s]/g, '').replace(',', '.');
      item.unitPrice = parseFloat(unitPrice);
    }

    // Extraer descripción (todo lo que no sea número o precio)
    const descriptionMatch = line.match(/^([^0-9€$]*?)(?:\d|€|$)/);
    if (descriptionMatch) {
      item.description = descriptionMatch[1].trim();
    }

    // Calcular total del item
    if (item.quantity && item.unitPrice) {
      item.totalPrice = item.quantity * item.unitPrice;
    }

    if (item.description && item.quantity) {
      extracted.items!.push(item);
    }
  }

  // Extraer totales
  const totalMatch = text.match(/TOTAL\s*:?\s*[€$]?\s*(\d+(?:[,.]\d+)?)/i);
  if (totalMatch) {
    extracted.totals!.total = parseFloat(totalMatch[1].replace(',', '.'));
  }

  const subtotalMatch = text.match(/SUBTOTAL\s*:?\s*[€$]?\s*(\d+(?:[,.]\d+)?)/i);
  if (subtotalMatch) {
    extracted.totals!.subtotal = parseFloat(subtotalMatch[1].replace(',', '.'));
  }

  const taxMatch = text.match(/IVA\s*:?\s*[€$]?\s*(\d+(?:[,.]\d+)?)/i);
  if (taxMatch) {
    extracted.totals!.tax = parseFloat(taxMatch[1].replace(',', '.'));
  }

  return extracted;
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== INICIANDO PROCESAMIENTO OCR CON GUARDADO ===')
    
    // Verificar autenticación
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    const user = await AuthService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 401 })
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: 'No se envió ningún archivo.' 
      }, { status: 400 });
    }

    console.log('📁 Archivo recibido:', file.name)
    console.log('📏 Tamaño:', file.size, 'bytes')

    // Verificar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false,
        error: 'Tipo de archivo no soportado. Use: JPG, PNG, PDF' 
      }, { status: 400 });
    }

    const startTime = Date.now();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('🔄 Iniciando reconocimiento OCR...')

    // Reutilizar worker entre invocaciones para performance
    if (!(globalThis as any).__OCR_WORKER__) {
      (globalThis as any).__OCR_WORKER__ = (async () => {
        const worker = await Tesseract.createWorker('spa', {
          langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast'
        } as any)
        await (worker as any).setParameters({
          tessedit_pageseg_mode: String(Tesseract.PSM.AUTO),
          user_defined_dpi: '300',
          tessedit_char_blacklist: '¡¿'
        })
        return worker
      })()
    }
    
    const worker = await (globalThis as any).__OCR_WORKER__
    const { data: { text } } = await worker.recognize(buffer)
    
    const processingTime = Date.now() - startTime;
    console.log('✅ OCR completado en', processingTime, 'ms')
    
    // Extraer datos estructurados
    const extractedData = extractDataFromText(text);
    
    console.log('📊 Datos extraídos:', JSON.stringify(extractedData, null, 2))

    // Procesar proveedor si existe
    let supplierId: string | undefined
    if (extractedData.supplier?.name) {
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

    // Crear documento en base de datos
    const document = await prisma.document.create({
      data: {
        filename: file.name,
        originalText: text,
        extractedData: extractedData as any,
        documentType: extractedData.documentType === 'invoice' ? 'INVOICE' : 'DELIVERY_NOTE',
        userId: user.id,
        supplierId,
        documentNumber: extractedData.documentNumber,
        documentDate: extractedData.date ? new Date(extractedData.date) : null,
        subtotal: extractedData.totals?.subtotal || 0,
        taxAmount: extractedData.totals?.tax || 0,
        totalAmount: extractedData.totals?.total || 0,
        fileSize: file.size,
        fileType: file.type,
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
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        total: item.totalPrice || 0,
        documentId: document.id
      }))

      await prisma.documentItem.createMany({
        data: itemsData
      })
    }

    // Obtener documento con items actualizados
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

    console.log('✅ Documento guardado en base de datos:', document.id)

    return NextResponse.json({ 
      success: true,
      data: {
        document: documentWithItems,
        extractedData,
        text,
        processingTime,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      },
      message: 'Documento procesado y guardado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error en procesamiento OCR:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Error procesando el documento', 
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
