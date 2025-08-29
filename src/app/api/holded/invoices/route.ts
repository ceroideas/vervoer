import { NextRequest, NextResponse } from 'next/server';
import { holdedClient } from '@/holded/client';



export async function GET(req: NextRequest) {
  try {
    console.log('📄 Obteniendo facturas de Holded...');
    
    const invoices = await holdedClient.getInvoices();
    
    console.log(`✅ Facturas obtenidas: ${invoices.length}`);
    
    return NextResponse.json({
      success: true,
      invoices: invoices,
      count: invoices.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo facturas de Holded:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo facturas de Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
