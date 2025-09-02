import { NextRequest, NextResponse } from 'next/server';
import { priceAnalysisService } from '@/lib/price-analysis';

// Actualizar producto automáticamente
export async function POST(req: NextRequest) {
  try {
    console.log('📊 Actualizando producto automáticamente...');
    
    const body = await req.json();
    const { productId, newData } = body;

    if (!productId || !newData) {
      return NextResponse.json({
        success: false,
        error: 'ID de producto y nuevos datos son requeridos',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const success = await priceAnalysisService.updateProductInHolded(productId, newData);
    
    if (success) {
      console.log(`✅ Producto actualizado exitosamente: ${productId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Producto actualizado exitosamente en Holded',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`❌ Error actualizando producto: ${productId}`);
      
      return NextResponse.json({
        success: false,
        error: 'Error actualizando producto en Holded',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error actualizando producto',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
