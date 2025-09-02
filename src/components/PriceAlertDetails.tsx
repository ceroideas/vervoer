import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Building2, Package } from 'lucide-react';
import { PriceAnalysisResult } from '@/lib/document-price-analysis';

interface PriceAlertDetailsProps {
  analysis: PriceAnalysisResult;
  item: any;
}

export function PriceAlertDetails({ analysis, item }: PriceAlertDetailsProps) {
  if (!analysis.hasPriceVariation && analysis.alertType === 'normal') {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          {analysis.message}
        </AlertDescription>
      </Alert>
    );
  }

  const getAlertIcon = () => {
    switch (analysis.alertType) {
      case 'price_increase':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'price_decrease':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'discount_anomaly':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getAlertVariant = () => {
    switch (analysis.severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSeverityColor = () => {
    switch (analysis.severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      {/* Alerta principal */}
      <Alert className={`border-2 ${getSeverityColor()}`}>
        {getAlertIcon()}
        <AlertDescription className="font-medium">
          {analysis.message}
        </AlertDescription>
      </Alert>

      {/* Detalles de comparación */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Comparación de Precios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Precio Anterior</div>
              <div className="text-lg font-semibold text-gray-800">
                {analysis.oldPrice ? `${analysis.oldPrice.toFixed(2)}€` : 'N/A'}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-600 mb-1">Nuevo Precio</div>
              <div className="text-lg font-semibold text-blue-800">
                {analysis.newPrice.toFixed(2)}€
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <span className="text-sm font-medium text-yellow-800">Variación:</span>
            <Badge variant={getAlertVariant()} className="text-sm">
              {analysis.variationAmount > 0 ? '+' : ''}{analysis.variationAmount.toFixed(2)}€ 
              ({analysis.variationPercentage > 0 ? '+' : ''}{analysis.variationPercentage.toFixed(1)}%)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Información del producto */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Estado del Producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analysis.isInHolded && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Producto encontrado en Holded
              </span>
            </div>
          )}
          
          {analysis.existingProduct && !analysis.isInHolded && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                Producto encontrado en base de datos local
              </span>
            </div>
          )}
          
          {!analysis.existingProduct && !analysis.isInHolded && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Package className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-800">
                Producto nuevo - no encontrado en sistema
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendación */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recomendación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700">
            {analysis.severity === 'critical' && (
              <p className="text-red-700 font-medium">
                ⚠️ Revisión crítica requerida - Aumento de precio muy significativo
              </p>
            )}
                         {analysis.severity === 'high' && analysis.alertType === 'price_increase' && (
               <p className="text-orange-700 font-medium">
                 ⚠️ Revisar con proveedor - Aumento de precio significativo
               </p>
             )}
             {analysis.severity === 'high' && analysis.alertType === 'discount_anomaly' && (
               <p className="text-red-700 font-medium">
                 ⚠️ Descuento crítico - Revisar calidad del producto
               </p>
             )}
                         {analysis.severity === 'medium' && analysis.alertType === 'price_increase' && (
               <p className="text-yellow-700">
                 📋 Monitorear - Variación de precio detectada
               </p>
             )}
             {analysis.severity === 'medium' && analysis.alertType === 'discount_anomaly' && (
               <p className="text-orange-700">
                 ⚠️ Descuento anómalo - Verificar condiciones del proveedor
               </p>
             )}
            {analysis.severity === 'low' && (
              <p className="text-green-700">
                ✅ Normal - Variación dentro de rangos aceptables
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
