import { NextRequest, NextResponse } from 'next/server';
import { holdedClient } from '@/holded/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docType: string; id: string }> }
) {
  try {
    const { docType, id } = await params;
    
    if (!['invoice', 'waybill'].includes(docType)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de documento inválido. Debe ser "invoice" o "waybill"',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Obtener PDF usando el cliente de Holded
    const pdfData = await holdedClient.getDocumentPdf(docType, id);
    
    console.log(`📄 PDF obtenido de Holded: ${docType}/${id}`);
    console.log('Tipo de respuesta:', typeof pdfData);
    console.log('Es ArrayBuffer:', pdfData instanceof ArrayBuffer);
    console.log('Es Uint8Array:', pdfData instanceof Uint8Array);
    console.log('Es objeto:', typeof pdfData === 'object' && pdfData !== null);
    if (typeof pdfData === 'object' && pdfData !== null) {
      console.log('Claves del objeto:', Object.keys(pdfData));
      console.log('Tiene status:', 'status' in pdfData);
      console.log('Status value:', (pdfData as any).status);
    }
    
    // Si la respuesta es un blob o buffer, devolverlo directamente
    if (pdfData instanceof ArrayBuffer || pdfData instanceof Uint8Array) {
      // Convertir ArrayBuffer o Uint8Array a Buffer para NextResponse
      const buffer = pdfData instanceof ArrayBuffer 
        ? Buffer.from(pdfData) 
        : Buffer.from(pdfData);
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${docType}-${id}.pdf"`
        }
      });
    }
    
    // Si es un objeto con URL o datos, devolver la información
    // La respuesta de Holded viene con status: 1 y data (base64)
    if (pdfData && typeof pdfData === 'object' && 'status' in pdfData) {
      return NextResponse.json(pdfData);
    }
    
    // Si no tiene el formato esperado, devolver como antes
    return NextResponse.json({
      success: true,
      pdfData: pdfData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error obteniendo PDF de Holded:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo PDF de Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
