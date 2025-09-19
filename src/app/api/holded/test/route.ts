import { NextRequest, NextResponse } from 'next/server';
import { holdedClient } from '@/holded/client';



export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Probando conexión con Holded...');
    
    // Probar la conexión
    const isConnected = await holdedClient.testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo conectar con Holded',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Obtener algunos datos de prueba
    let contacts: any[] = [];
    let invoices: any[] = [];
    let products: any[] = [];
    let waybills: any[] = [];
    
    try {
      contacts = await holdedClient.getContacts();
    } catch (error) {
      console.log('❌ Error obteniendo contactos:', error);
    }
    
    try {
      invoices = await holdedClient.getInvoices();
    } catch (error) {
      console.log('❌ Error obteniendo facturas:', error);
    }
    
    try {
      products = await holdedClient.getProducts();
    } catch (error) {
      console.log('❌ Error obteniendo productos:', error);
    }
    
    try {
      waybills = await holdedClient.getWaybills();
    } catch (error) {
      console.log('❌ Error obteniendo albaranes:', error);
    }

    console.log('✅ Conexión con Holded exitosa');
    console.log(`📊 Contactos: ${contacts.length}`);
    console.log(`📊 Facturas: ${invoices.length}`);
    console.log(`📊 Productos: ${products.length}`);
    console.log(`📊 Albaranes: ${waybills.length}`);

    return NextResponse.json({
      success: true,
      message: 'Conexión con Holded exitosa',
      data: {
        contacts: contacts.length,
        invoices: invoices.length,
        products: products.length,
        waybills: waybills.length,
        sampleContacts: contacts.slice(0, 3), // Primeros 3 contactos como ejemplo
        sampleInvoices: invoices.slice(0, 3), // Primeras 3 facturas como ejemplo
        sampleWaybills: waybills.slice(0, 3), // Primeros 3 albaranes como ejemplo
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error probando conexión con Holded:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error conectando con Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
