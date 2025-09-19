import { NextRequest, NextResponse } from 'next/server'
import { processImageFile, isSupportedFileType } from '@/utils/imageConverter';
import OpenAI from 'openai';



// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface InvoiceData {
  proveedor: string;
  numeroAlbaranFactura: string;
  fecha: string;
  referencia: string;
  descripcion: string;
  unidades: number;
  precioUnitario: number;
  importe: number;
  suma: number; // Base Imponible
  total: number; // Base Imponible + IVA
}

interface ExtractedInvoiceData {
  documentType: 'invoice' | 'delivery_note';
  supplier?: {
    name?: string;
    address?: string;
    taxId?: string;
  };
  documentNumber?: string;
  date?: string;
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
  rawData?: InvoiceData[];
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== INICIANDO PROCESAMIENTO GPT-4o-mini ===');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    console.log('📁 Archivo recibido:', file.name);
    console.log('📏 Tamaño:', file.size, 'bytes');
    console.log('📋 Tipo:', file.type);

    // Verificar tipo de archivo (incluyendo HEIC/HEIF de iPhone)
    if (!isSupportedFileType(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no soportado. Use: JPG, PNG, PDF, HEIC' 
      }, { status: 400 });
    }

    // Procesar archivo (convertir HEIC a JPEG si es necesario)
    let processedFile = file;
    try {
      processedFile = await processImageFile(file);
      console.log('✅ Archivo procesado:', processedFile.name, processedFile.type);
    } catch (conversionError) {
      console.error('❌ Error procesando archivo:', conversionError);
      return NextResponse.json({ 
        error: 'Error procesando imagen. Intente con otro formato.' 
      }, { status: 400 });
    }

    // Convertir archivo a base64
    const arrayBuffer = await processedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Prompt específico para extraer datos de facturas
    const systemPrompt = `Eres un experto en procesamiento de documentos comerciales. Tu tarea es extraer información estructurada de facturas y albaranes en español.

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
13. Maneja correctamente los separadores decimales (comas y puntos)`;

    console.log('🤖 Enviando imagen a GPT-4o-mini...');

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
                url: `data:${file.type};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1, // Baja temperatura para respuestas más consistentes
    });

    console.log('✅ Respuesta recibida de GPT-4o-mini');

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No se recibió respuesta de GPT-4o-mini');
    }

    console.log('📄 Respuesta raw:', content.substring(0, 200) + '...');

    // Intentar parsear el JSON de la respuesta
    let extractedData: ExtractedInvoiceData;
    try {
      // Buscar JSON en la respuesta (a veces GPT añade texto adicional)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      console.error('📄 Contenido completo:', content);
      
      // Fallback: intentar extraer datos básicos del texto
      extractedData = {
        documentType: content.toLowerCase().includes('factura') ? 'invoice' : 'delivery_note',
        items: [],
        totals: {}
      };
    }

    console.log('📊 Datos extraídos:', JSON.stringify(extractedData, null, 2));

    return NextResponse.json({ 
      success: true,
      extractedData,
      rawResponse: content,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
    
  } catch (error) {
    console.error('❌ Error en GPT-4o-mini:', error);
    
    return NextResponse.json({ 
      error: 'Error procesando con GPT-4o-mini', 
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
