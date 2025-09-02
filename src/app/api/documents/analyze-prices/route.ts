import { NextRequest, NextResponse } from 'next/server';
import { documentPriceAnalysisService } from '@/lib/document-price-analysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, documentNumber, documentDate, supplierName } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({
        success: false,
        error: 'Items del documento son requeridos',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Analizando precios para documento

    // Analizar cada item del documento
    const analyses = await documentPriceAnalysisService.analyzeDocumentItems(items);

    // Guardar alertas de precio en la base de datos
    for (const analysis of analyses) {
      if (analysis.priceAnalysis.hasPriceVariation) {
        const productId = analysis.priceAnalysis.existingProduct?.id || 
                         analysis.priceAnalysis.holdedProduct?.id || 
                         'unknown';
        
        await documentPriceAnalysisService.savePriceAlert(
          productId,
          analysis.item.description || 'Producto sin nombre',
          analysis.item.reference || '',
          analysis.priceAnalysis.oldPrice || 0,
          analysis.priceAnalysis.newPrice,
          analysis.priceAnalysis.variationPercentage,
          analysis.priceAnalysis.variationAmount,
          documentNumber || 'DOC-' + Date.now(),
          new Date(documentDate || new Date()),
          supplierName || 'Proveedor desconocido',
          analysis.priceAnalysis.alertType,
          analysis.priceAnalysis.severity
        );
      }
    }

    // Contar alertas por severidad
    const alertCounts = {
      critical: analyses.filter(a => a.priceAnalysis.severity === 'critical').length,
      high: analyses.filter(a => a.priceAnalysis.severity === 'high').length,
      medium: analyses.filter(a => a.priceAnalysis.severity === 'medium').length,
      low: analyses.filter(a => a.priceAnalysis.severity === 'low').length,
      total: analyses.filter(a => a.priceAnalysis.hasPriceVariation).length
    };

    // Análisis completado

    return NextResponse.json({
      success: true,
      analyses,
      alertCounts,
      message: `Análisis completado - ${alertCounts.total} alertas de precio encontradas`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error analizando precios:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
