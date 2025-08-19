import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import OpenAI from 'openai';

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    totalPrice?: number;
  }>;
  totals?: {
    subtotal?: number;
    tax?: number;
    total?: number;
  };
}

// Función para extraer datos con OCR tradicional (mejorada)
function extractDataFromOCRText(text: string): ExtractedData {
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

    // Extraer precio total
    if (unitPriceMatch && unitPriceMatch.length >= 2) {
      const totalPrice = unitPriceMatch[unitPriceMatch.length - 1].replace(/[€$\s]/g, '').replace(',', '.');
      item.totalPrice = parseFloat(totalPrice);
    }

    // Extraer descripción
    const description = line
      .replace(/[€$]?\s*\d+(?:[,.]\d+)?\s*[€$]?/g, '')
      .replace(/\d+(?:[,.]\d+)?\s*(?:x|un|ud|pcs?)/i, '')
      .replace(/^\s*[-_]\s*/, '')
      .trim();
    
    if (description.length > 3) {
      item.description = description;
    }

    // Extraer referencia
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

  return extracted;
}

// Función para extraer datos con GPT-4o mini
async function extractDataWithGPT4Vision(base64Image: string, fileType: string): Promise<ExtractedData> {
  const systemPrompt = `Eres un experto en procesamiento de documentos comerciales. Extrae información estructurada de facturas y albaranes en español.

Responde ÚNICAMENTE con un JSON válido:
{
  "documentType": "invoice" o "delivery_note",
  "supplier": {
    "name": "Nombre del proveedor",
    "address": "Dirección (si está disponible)",
    "taxId": "CIF/NIF (si está disponible)"
  },
  "documentNumber": "Número de factura/albarán",
  "date": "Fecha en formato DD/MM/YYYY",
  "items": [
    {
      "reference": "Código de referencia",
      "description": "Descripción del producto",
      "quantity": número,
      "unitPrice": número (precio unitario con descuentos),
      "totalPrice": número (precio total de la línea)
    }
  ],
  "totals": {
    "subtotal": número (suma de importes, base imponible),
    "tax": número (IVA),
    "total": número (total final)
  }
}

INSTRUCCIONES:
1. Busca proveedor cerca de "PROVEEDOR", "EMISOR", "VENDEDOR", "EMPRESA"
2. Número de documento: "FACTURA Nº", "ALBARÁN Nº", etc.
3. Fecha: DD/MM/YYYY, DD-MM-YYYY
4. Productos: referencia, descripción, cantidad, precio unitario, importe
5. Precios unitarios = PVP (con descuentos aplicados)
6. Base imponible = suma de todos los importes
7. Total = base imponible + IVA
8. Si no hay dato, usa null o string vacío
9. Números como números, no strings
10. Maneja separadores decimales (comas y puntos)`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extrae todos los datos de esta factura/albarán. Responde únicamente con el JSON válido."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${fileType};base64,${base64Image}`,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 2000,
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No se recibió respuesta de GPT-4o mini');
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No se encontró JSON válido en la respuesta');
    }
  } catch (parseError) {
    console.error('Error parseando JSON de GPT-4o mini:', parseError);
    return {
      documentType: content.toLowerCase().includes('factura') ? 'invoice' : 'delivery_note',
      items: [],
      totals: {}
    };
  }
}

// Función para combinar y validar datos de ambas fuentes
function mergeAndValidateData(ocrData: ExtractedData, gptData: ExtractedData): ExtractedData {
  const merged: ExtractedData = {
    documentType: gptData.documentType || ocrData.documentType,
    items: [],
    totals: {}
  };

  // Combinar proveedor (preferir GPT-4 si está disponible)
  merged.supplier = gptData.supplier || ocrData.supplier;

  // Combinar número de documento
  merged.documentNumber = gptData.documentNumber || ocrData.documentNumber;

  // Combinar fecha
  merged.date = gptData.date || ocrData.date;

  // Combinar items (preferir GPT-4, pero usar OCR como respaldo)
  if (gptData.items && gptData.items.length > 0) {
    merged.items = gptData.items;
  } else if (ocrData.items && ocrData.items.length > 0) {
    merged.items = ocrData.items;
  }

  // Combinar totales (preferir GPT-4)
  merged.totals = gptData.totals || ocrData.totals;

  return merged;
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== INICIANDO PROCESAMIENTO HÍBRIDO OCR + GPT-4o mini ===');
    console.log('🔑 API Key disponible:', process.env.OPENAI_API_KEY ? 'SÍ' : 'NO');
    console.log('🔑 API Key (primeros 10 chars):', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'NO DISPONIBLE');
    console.log('⏰ Timestamp inicio:', new Date().toISOString());
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    console.log('📁 Archivo recibido:', file.name);
    console.log('📏 Tamaño:', file.size, 'bytes');
    console.log('📋 Tipo:', file.type);

    // Verificar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no soportado. Use: JPG, PNG, PDF' 
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Procesar con OCR tradicional
    console.log('🔍 Iniciando OCR tradicional...');
    console.log('📊 Tamaño del buffer:', buffer.length, 'bytes');
    let ocrData: ExtractedData;
    
    try {
      console.log('🔧 Creando worker OCR...');
      console.log('📦 Inicializando Tesseract con configuración simple...');
      
      // Usar configuración más simple para evitar problemas de worker
      const worker = await Tesseract.createWorker('spa');
      console.log('⚙️ Configurando parámetros OCR...');
      await (worker as any).setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });
      
      console.log('📝 Iniciando reconocimiento de texto...');
      const { data: { text } } = await worker.recognize(buffer);
      console.log('📄 Texto extraído (primeros 200 chars):', text.substring(0, 200) + '...');
      
      console.log('🧹 Terminando worker OCR...');
      await worker.terminate();
      
      console.log('✅ OCR tradicional completado');
      ocrData = extractDataFromOCRText(text);
      
    } catch (ocrError) {
      console.error('❌ Error en OCR tradicional:', ocrError);
      ocrData = {
        documentType: 'invoice',
        items: [],
        totals: {}
      };
    }

    // Procesar con GPT-4o mini
    console.log('🤖 Iniciando GPT-4o mini...');
    console.log('📊 Tamaño base64:', base64Image.length, 'caracteres');
    let gptData: ExtractedData;
    
    try {
      console.log('🌐 Enviando solicitud a OpenAI...');
      gptData = await extractDataWithGPT4Vision(base64Image, file.type);
      console.log('📊 Datos GPT-4 extraídos:', JSON.stringify(gptData, null, 2));
      console.log('✅ GPT-4o mini completado');
    } catch (gptError) {
      console.error('❌ Error en GPT-4o mini:', gptError);
      console.error('🔍 Detalles del error:', gptError);
      gptData = {
        documentType: 'invoice',
        items: [],
        totals: {}
      };
    }

    // Combinar y validar datos
    console.log('🔄 Combinando datos de ambas fuentes...');
    const finalData = mergeAndValidateData(ocrData, gptData);

    console.log('📊 Datos finales:', JSON.stringify(finalData, null, 2));
    console.log('⏰ Timestamp fin:', new Date().toISOString());
    console.log('🎉 PROCESAMIENTO HÍBRIDO COMPLETADO EXITOSAMENTE');

    return NextResponse.json({ 
      success: true,
      extractedData: finalData,
      ocrData,
      gptData,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
    
  } catch (error) {
    console.error('❌ Error en procesamiento híbrido:', error);
    
    return NextResponse.json({ 
      error: 'Error en procesamiento híbrido', 
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
