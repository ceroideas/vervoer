import { NextRequest, NextResponse } from 'next/server';
import { holdedClient } from '@/holded/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docType = searchParams.get('type') as 'invoice' | 'waybill' | null;
    
    let documents = [];
    
    if (docType === 'invoice') {
      documents = await holdedClient.getInvoices();
    } else if (docType === 'waybill') {
      documents = await holdedClient.getWaybills();
    } else {
      // Obtener ambos tipos si no se especifica
      const [invoices, waybills] = await Promise.all([
        holdedClient.getInvoices(),
        holdedClient.getWaybills()
      ]);
      
      // Combinar y marcar el tipo
      documents = [
        ...invoices.map(doc => ({ ...doc, docType: 'invoice' })),
        ...waybills.map(doc => ({ ...doc, docType: 'waybill' }))
      ];
    }
    
    console.log(`📄 Documentos obtenidos de Holded: ${documents.length} documentos`);
    
    return NextResponse.json({
      success: true,
      documents: documents,
      count: documents.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo documentos de Holded:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo documentos de Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
