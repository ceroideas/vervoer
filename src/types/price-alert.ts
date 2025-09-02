export interface PriceVariation {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  oldPrice: number;
  newPrice: number;
  variationPercentage: number;
  variationAmount: number;
  documentNumber: string;
  documentDate: string;
  supplierName: string;
  alertType: 'price_increase' | 'price_decrease' | 'discount_anomaly' | 'normal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isProcessed: boolean;
  createdAt: string;
  notes?: string;
}

export interface ProductPriceHistory {
  id: string;
  productId: string;
  price: number;
  cost: number;
  documentNumber: string;
  documentDate: string;
  supplierName: string;
  quantity: number;
  totalAmount: number;
  createdAt: string;
}

export interface PriceAlertConfig {
  maxPriceIncreasePercentage: number; // Porcentaje máximo de aumento sin alerta
  minDiscountPercentage: number; // Descuento mínimo para considerar anómalo
  maxDiscountPercentage: number; // Descuento máximo para considerar anómalo
  criticalPriceIncreasePercentage: number; // Aumento crítico
  enableAutomaticUpdates: boolean; // Si actualizar automáticamente productos
  enablePriceHistory: boolean; // Si mantener historial de precios
}

export interface ProductMatch {
  product: any; // HoldedProduct
  confidence: number; // 0-1, qué tan seguro es el match
  matchType: 'exact_sku' | 'exact_name' | 'similar_name' | 'partial_match';
  suggestedAction: 'create_new' | 'update_existing' | 'manual_review';
}

export interface PriceAnalysisResult {
  productMatch: ProductMatch;
  priceVariation?: PriceVariation;
  shouldCreateAlert: boolean;
  recommendedAction: 'create' | 'update' | 'review';
  confidence: number;
}
