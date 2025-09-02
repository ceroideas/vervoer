import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { PriceAnalysisResult } from '@/lib/document-price-analysis';

interface PriceAlertBadgeProps {
  analysis: PriceAnalysisResult;
}

export function PriceAlertBadge({ analysis }: PriceAlertBadgeProps) {
  if (!analysis.hasPriceVariation && analysis.alertType === 'normal') {
    return null;
  }

  const getBadgeVariant = () => {
    switch (analysis.severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getIcon = () => {
    switch (analysis.alertType) {
      case 'price_increase':
        return <TrendingUp className="h-3 w-3" />;
      case 'price_decrease':
        return <TrendingDown className="h-3 w-3" />;
      case 'discount_anomaly':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <CheckCircle className="h-3 w-3" />;
    }
  };

  const getBadgeText = () => {
    switch (analysis.alertType) {
      case 'price_increase':
        return `+${analysis.variationPercentage.toFixed(1)}%`;
      case 'price_decrease':
        return `${analysis.variationPercentage.toFixed(1)}%`;
      case 'discount_anomaly':
        return 'Descuento Anómalo';
      default:
        return 'Normal';
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Badge variant={getBadgeVariant()} className="flex items-center gap-1 text-xs">
        {getIcon()}
        {getBadgeText()}
      </Badge>
      
      {analysis.isInHolded && (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          En Holded
        </Badge>
      )}
      
      {analysis.existingProduct && !analysis.isInHolded && (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          En BD Local
        </Badge>
      )}
    </div>
  );
}
