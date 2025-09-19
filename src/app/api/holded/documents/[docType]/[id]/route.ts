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
    
    const document = await holdedClient.getDocument(docType as 'invoice' | 'waybill', id);
    
    console.log(`📄 Documento obtenido de Holded: ${docType}/${id}`);
    
    return NextResponse.json({
      success: true,
      document: document,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error obteniendo documento de Holded:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo documento de Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(
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
    
    // Eliminar documento usando el cliente de Holded
    await holdedClient.deleteDocument(docType, id);
    
    console.log(`🗑️ Documento eliminado de Holded: ${docType}/${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error eliminando documento de Holded:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Error eliminando documento de Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
