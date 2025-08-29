import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';



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
    discount?: number; // Descuento en porcentaje o cantidad
    discountType?: 'percentage' | 'amount'; // Tipo de descuento
    totalPrice?: number;
  }>;
  totals?: {
    subtotal?: number;
    discount?: number; // Descuento total del documento
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

  // Extraer proveedor (buscar después de palabras clave)
  const supplierKeywords = ['PROVEEDOR', 'EMISOR', 'VENDEDOR', 'EMPRESA', 'COMPAÑÍA', 'COMPAÑIA'];
  for (const keyword of supplierKeywords) {
    const supplierMatch = text.match(new RegExp(`${keyword}\\s*:?\\s*([^\\n]+)`, 'i'));
    if (supplierMatch) {
      extracted.supplier = { name: supplierMatch[1].trim() };
      break;
    }
  }

  // Extraer productos (buscar líneas que contengan cantidades y precios)
  const itemLines = lines.filter(line => {
    // Buscar líneas que contengan números (cantidades) y posiblemente precios
    const hasNumbers = /\d+/.test(line);
    const hasPrice = /[€$]?\s*\d+[,.]?\d*/.test(line);
    const isNotHeader = !line.match(/^(FACTURA|ALBARÁN|ALBARAN|TOTAL|SUBTOTAL|IVA)/i);
    return hasNumbers && (hasPrice || isNotHeader) && line.length > 10;
  });

  for (const line of itemLines.slice(0, 10)) { // Limitar a 10 productos
    const item: any = {};
    
    // Extraer cantidad
    const quantityMatch = line.match(/(\d+(?:[,.]\d+)?)\s*(?:x|un|ud|pcs?)/i);
    if (quantityMatch) {
      item.quantity = parseFloat(quantityMatch[1].replace(',', '.'));
    }

    // Detectar descuentos (% o €)
    const discountMatch = line.match(/(?:descuento|dto\.?|discount)\s*:?\s*([+-]?\d+(?:[,.]\d+)?)\s*(%|€|euros?)?/i);
    if (discountMatch) {
      const discountValue = parseFloat(discountMatch[1].replace(',', '.'));
      const discountUnit = discountMatch[2];
      if (discountUnit === '%') {
        item.discount = discountValue;
        item.discountType = 'percentage';
      } else {
        item.discount = discountValue;
        item.discountType = 'amount';
      }
    }

    // Extraer precio unitario
    const unitPriceMatch = line.match(/[€$]?\s*(\d+(?:[,.]\d+)?)\s*[€$]?/g);
    if (unitPriceMatch && unitPriceMatch.length >= 2) {
      const unitPrice = unitPriceMatch[0].replace(/[€$\s]/g, '').replace(',', '.');
      item.unitPrice = parseFloat(unitPrice);
    }

    // Extraer precio total
    if (unitPriceMatch && unitPriceMatch.length >= 2) {
      const totalPrice = unitPriceMatch[unitPriceMatch.length - 1].replace(/[€$\s]/g, '').replace(',', '.');
      item.totalPrice = parseFloat(totalPrice);
    }

    // Extraer descripción (todo lo que no sea números o precios)
    const description = line
      .replace(/[€$]?\s*\d+(?:[,.]\d+)?\s*[€$]?/g, '') // Remover precios
      .replace(/\d+(?:[,.]\d+)?\s*(?:x|un|ud|pcs?)/i, '') // Remover cantidades
      .replace(/^\s*[-_]\s*/, '') // Remover guiones iniciales
      .trim();
    
    if (description.length > 3) {
      item.description = description;
    }

    // Extraer referencia (código de producto)
    const referenceMatch = line.match(/([A-Z0-9]{3,10})/);
    if (referenceMatch) {
      item.reference = referenceMatch[1];
    }

    if (item.description || item.quantity || item.unitPrice) {
      extracted.items?.push(item);
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

  // Extraer descuento total del documento
  const discountMatch = text.match(/(?:DESCUENTO|DTOS?\.?)\s*(?:TOTAL|GENERAL)?\s*:?\s*[€$]?\s*(\d+(?:[,.]\d+)?)/i);
  if (discountMatch) {
    extracted.totals!.discount = parseFloat(discountMatch[1].replace(',', '.'));
  }

  return extracted;
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== INICIANDO PROCESAMIENTO OCR ===')
    console.log('📡 URL de la petición:', req.url)
    console.log('📡 Método:', req.method)
    
    // Primero, verificar que la petición llegue
    const formData = await req.formData();
    console.log('✅ FormData procesado')
    
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('❌ No se recibió archivo')
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    console.log('📁 Archivo recibido:', file.name)
    console.log('📏 Tamaño:', file.size, 'bytes')
    console.log('📋 Tipo:', file.type)

    // Verificar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Tipo de archivo no soportado:', file.type)
      return NextResponse.json({ 
        error: 'Tipo de archivo no soportado. Use: JPG, PNG, PDF' 
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('🔄 Iniciando reconocimiento OCR con Tesseract (worker, best models)...')

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
    
    console.log('✅ OCR completado. Texto extraído (primeros 200 caracteres):', text.substring(0, 200) + '...')
    
    // Extraer datos estructurados
    const extractedData = extractDataFromText(text);
    
    console.log('📊 Datos extraídos:', JSON.stringify(extractedData, null, 2))

    return NextResponse.json({ 
      text,
      extractedData,
      success: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
    
  } catch (error) {
    console.error('❌ Error en OCR:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    
    return NextResponse.json({ 
      error: 'Error procesando el OCR', 
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
