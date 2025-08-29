import { NextRequest, NextResponse } from 'next/server';
import { holdedClient } from '@/holded/client';



export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronización con Holded...');
    
    const body = await req.json();
    const { extractedData } = body;

    if (!extractedData) {
      return NextResponse.json({
        success: false,
        error: 'Datos extraídos requeridos',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log('📊 Datos a sincronizar:', JSON.stringify(extractedData, null, 2));

    // Sincronizar proveedor
    console.log('👤 Sincronizando proveedor...');
    const supplier = await holdedClient.syncSupplier({
      name: extractedData.supplier?.name || 'Proveedor Desconocido',
      taxId: extractedData.supplier?.taxId,
      address: extractedData.supplier?.address,
    });

    if (!supplier) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo sincronizar el proveedor',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('✅ Proveedor sincronizado:', supplier.name);

    // Crear factura en Holded
    console.log('📄 Creando factura en Holded...');
    const invoice = await holdedClient.createInvoiceFromExtractedData({
      documentNumber: extractedData.documentNumber || 'SIN-NUMERO',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      supplier: {
        name: extractedData.supplier?.name || 'Proveedor Desconocido',
        taxId: extractedData.supplier?.taxId,
      },
      items: extractedData.items || [],
      totals: extractedData.totals || {
        subtotal: 0,
        tax: 0,
        total: 0,
      },
    });

    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo crear la factura en Holded',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('✅ Factura creada en Holded:', invoice.number);

    return NextResponse.json({
      success: true,
      message: 'Datos sincronizados exitosamente con Holded',
      data: {
        supplier: {
          id: supplier.id,
          name: supplier.name,
          taxId: supplier.taxId,
        },
        invoice: {
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          total: invoice.total,
        },
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sincronizando con Holded:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error sincronizando con Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
