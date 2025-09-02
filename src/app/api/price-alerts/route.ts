import { NextRequest, NextResponse } from 'next/server';
import { priceAnalysisService } from '@/lib/price-analysis';

// Obtener alertas de precios
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const processed = searchParams.get('processed');
    const severity = searchParams.get('severity');
    const alertType = searchParams.get('alertType');

    console.log('📊 Obteniendo alertas de precios...');
    
    const alerts = await priceAnalysisService.getUnprocessedAlerts();
    
    // Filtrar por parámetros si se proporcionan
    let filteredAlerts = alerts;
    
    if (processed !== null) {
      const isProcessed = processed === 'true';
      filteredAlerts = filteredAlerts.filter(alert => alert.isProcessed === isProcessed);
    }
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (alertType) {
      filteredAlerts = filteredAlerts.filter(alert => alert.alertType === alertType);
    }
    
    console.log(`✅ Alertas obtenidas: ${filteredAlerts.length}`);
    
    return NextResponse.json({
      success: true,
      alerts: filteredAlerts,
      count: filteredAlerts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo alertas de precios:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo alertas de precios',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Analizar producto y crear alerta si es necesario
export async function POST(req: NextRequest) {
  try {
    console.log('📊 Analizando producto para alertas de precio...');
    
    const body = await req.json();
    const { productData, documentInfo } = body;

    if (!productData || !documentInfo) {
      return NextResponse.json({
        success: false,
        error: 'Datos de producto y documento son requeridos',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const analysisResult = await priceAnalysisService.analyzeProduct(productData, documentInfo);
    
    console.log(`✅ Análisis completado. Acción recomendada: ${analysisResult.recommendedAction}`);
    
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error analizando producto:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error analizando producto',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
