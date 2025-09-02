import { prisma } from '@/lib/prisma';
import { holdedClient } from '@/holded/client';
import { 
  PriceVariation, 
  ProductMatch, 
  PriceAnalysisResult, 
  PriceAlertConfig 
} from '@/types/price-alert';

export class PriceAnalysisService {
  private config: PriceAlertConfig;

  constructor() {
    // Configuración por defecto
    this.config = {
      maxPriceIncreasePercentage: 10.0,
      minDiscountPercentage: 15.0,
      maxDiscountPercentage: 60.0,
      criticalPriceIncreasePercentage: 25.0,
      enableAutomaticUpdates: false,
      enablePriceHistory: true
    };
    // Cargar configuración de la base de datos de forma asíncrona
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const config = await prisma.priceAlertConfig.findFirst();
      if (config) {
        this.config = {
          maxPriceIncreasePercentage: config.maxPriceIncreasePercentage,
          minDiscountPercentage: config.minDiscountPercentage,
          maxDiscountPercentage: config.maxDiscountPercentage,
          criticalPriceIncreasePercentage: config.criticalPriceIncreasePercentage,
          enableAutomaticUpdates: config.enableAutomaticUpdates,
          enablePriceHistory: config.enablePriceHistory
        };
      }
    } catch (error) {
      console.error('Error cargando configuración de alertas:', error);
      // Mantener configuración por defecto
    }
  }

  /**
   * Analiza un producto extraído de un documento y determina si existe en Holded
   */
  async analyzeProduct(
    productData: {
      name: string;
      sku?: string;
      reference?: string;
      price: number;
      cost?: number;
    },
    documentInfo: {
      documentNumber: string;
      documentDate: string;
      supplierName: string;
    }
  ): Promise<PriceAnalysisResult> {
    // Buscar productos en Holded
    const holdedProducts = await holdedClient.getProducts();
    
    // Intentar hacer match con productos existentes
    const productMatch = this.findProductMatch(productData, holdedProducts);
    
    if (productMatch.product) {
      // Producto encontrado - analizar variación de precio
      const priceVariation = await this.analyzePriceVariation(
        productMatch.product,
        productData,
        documentInfo
      );

      const shouldCreateAlert = this.shouldCreateAlert(priceVariation);
      const recommendedAction = this.getRecommendedAction(productMatch, priceVariation);

      return {
        productMatch,
        priceVariation,
        shouldCreateAlert,
        recommendedAction,
        confidence: productMatch.confidence
      };
    } else {
      // Producto no encontrado - crear nuevo
      return {
        productMatch,
        shouldCreateAlert: false,
        recommendedAction: 'create',
        confidence: 0
      };
    }
  }

  /**
   * Busca coincidencias de productos en Holded
   */
  private findProductMatch(
    productData: { name: string; sku?: string; reference?: string },
    holdedProducts: any[]
  ): ProductMatch {
    let bestMatch: ProductMatch = {
      product: null,
      confidence: 0,
      matchType: 'partial_match',
      suggestedAction: 'create_new'
    };

    for (const product of holdedProducts) {
      let confidence = 0;
      let matchType: ProductMatch['matchType'] = 'partial_match';

      // Match por SKU exacto
      if (productData.sku && product.sku && 
          productData.sku.toLowerCase() === product.sku.toLowerCase()) {
        confidence = 1.0;
        matchType = 'exact_sku';
      }
      // Match por referencia exacta
      else if (productData.reference && product.sku && 
               productData.reference.toLowerCase() === product.sku.toLowerCase()) {
        confidence = 0.95;
        matchType = 'exact_sku';
      }
      // Match por nombre exacto
      else if (productData.name.toLowerCase() === product.name.toLowerCase()) {
        confidence = 0.9;
        matchType = 'exact_name';
      }
      // Match por nombre similar (usando similitud de strings)
      else {
        const similarity = this.calculateStringSimilarity(
          productData.name.toLowerCase(),
          product.name.toLowerCase()
        );
        
        if (similarity > 0.8) {
          confidence = similarity;
          matchType = 'similar_name';
        }
      }

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          product,
          confidence,
          matchType,
          suggestedAction: confidence > 0.7 ? 'update_existing' : 'manual_review'
        };
      }
    }

    return bestMatch;
  }

  /**
   * Analiza la variación de precio de un producto existente
   */
  private async analyzePriceVariation(
    existingProduct: any,
    newProductData: { price: number; cost?: number },
    documentInfo: { documentNumber: string; documentDate: string; supplierName: string }
  ): Promise<PriceVariation | null> {
    const oldPrice = existingProduct.price || 0;
    const newPrice = newProductData.price;
    
    if (oldPrice === 0 || newPrice === 0) {
      return null;
    }

    const variationAmount = newPrice - oldPrice;
    const variationPercentage = (variationAmount / oldPrice) * 100;

    // Determinar tipo de alerta
    let alertType: PriceVariation['alertType'] = 'normal';
    let severity: PriceVariation['severity'] = 'low';

    if (variationAmount > 0) {
      // Aumento de precio
      if (variationPercentage > this.config.criticalPriceIncreasePercentage) {
        alertType = 'price_increase';
        severity = 'critical';
      } else if (variationPercentage > this.config.maxPriceIncreasePercentage) {
        alertType = 'price_increase';
        severity = 'high';
      } else {
        alertType = 'price_increase';
        severity = 'medium';
      }
    } else if (variationAmount < 0) {
      // Disminución de precio (descuento)
      const discountPercentage = Math.abs(variationPercentage);
      
      if (discountPercentage > this.config.maxDiscountPercentage || 
          discountPercentage < this.config.minDiscountPercentage) {
        alertType = 'discount_anomaly';
        severity = discountPercentage > this.config.maxDiscountPercentage ? 'high' : 'medium';
      } else {
        alertType = 'price_decrease';
        severity = 'low';
      }
    }

    // Crear registro de variación de precio
    const priceVariation = await prisma.priceVariation.create({
      data: {
        productId: existingProduct.id,
        productName: existingProduct.name,
        productSku: existingProduct.sku,
        oldPrice,
        newPrice,
        variationPercentage,
        variationAmount,
        documentNumber: documentInfo.documentNumber,
        documentDate: new Date(documentInfo.documentDate),
        supplierName: documentInfo.supplierName,
        alertType: alertType.toUpperCase() as any,
        severity: severity.toUpperCase() as any,
        isProcessed: false
      }
    });

    // Guardar en historial de precios
    if (this.config.enablePriceHistory) {
      await prisma.productPriceHistory.create({
        data: {
          productId: existingProduct.id,
          price: newPrice,
          cost: newProductData.cost || 0,
          documentNumber: documentInfo.documentNumber,
          documentDate: new Date(documentInfo.documentDate),
          supplierName: documentInfo.supplierName,
          quantity: 1, // Por defecto, se puede ajustar
          totalAmount: newPrice
        }
      });
    }

    return {
      id: priceVariation.id,
      productId: priceVariation.productId,
      productName: priceVariation.productName,
      productSku: priceVariation.productSku,
      oldPrice: priceVariation.oldPrice,
      newPrice: priceVariation.newPrice,
      variationPercentage: priceVariation.variationPercentage,
      variationAmount: priceVariation.variationAmount,
      documentNumber: priceVariation.documentNumber,
      documentDate: priceVariation.documentDate.toISOString(),
      supplierName: priceVariation.supplierName,
      alertType: priceVariation.alertType.toLowerCase() as any,
      severity: priceVariation.severity.toLowerCase() as any,
      isProcessed: priceVariation.isProcessed,
      notes: priceVariation.notes,
      createdAt: priceVariation.createdAt.toISOString()
    };
  }

  /**
   * Determina si se debe crear una alerta
   */
  private shouldCreateAlert(priceVariation: PriceVariation | null): boolean {
    if (!priceVariation) return false;

    return priceVariation.alertType !== 'normal' || 
           priceVariation.severity === 'high' || 
           priceVariation.severity === 'critical';
  }

  /**
   * Obtiene la acción recomendada
   */
  private getRecommendedAction(
    productMatch: ProductMatch, 
    priceVariation: PriceVariation | null
  ): 'create' | 'update' | 'review' {
    if (!productMatch.product) return 'create';
    
    if (priceVariation && priceVariation.severity === 'critical') {
      return 'review';
    }
    
    if (productMatch.confidence > 0.8) {
      return this.config.enableAutomaticUpdates ? 'update' : 'review';
    }
    
    return 'review';
  }

  /**
   * Calcula la similitud entre dos strings
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calcula la distancia de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Actualiza automáticamente un producto en Holded
   */
  async updateProductInHolded(
    productId: string, 
    newData: { price: number; cost?: number; name?: string; description?: string }
  ): Promise<boolean> {
    try {
      await holdedClient.updateProduct(productId, {
        price: newData.price,
        cost: newData.cost || 0,
        name: newData.name,
        desc: newData.description
      });
      
      // Marcar variación como procesada
      await prisma.priceVariation.updateMany({
        where: { productId, isProcessed: false },
        data: { isProcessed: true }
      });
      
      return true;
    } catch (error) {
      console.error('Error actualizando producto en Holded:', error);
      return false;
    }
  }

  /**
   * Obtiene alertas de precios no procesadas
   */
  async getUnprocessedAlerts(): Promise<PriceVariation[]> {
    const alerts = await prisma.priceVariation.findMany({
      where: { isProcessed: false },
      orderBy: { createdAt: 'desc' }
    });

    return alerts.map(alert => ({
      id: alert.id,
      productId: alert.productId,
      productName: alert.productName,
      productSku: alert.productSku,
      oldPrice: alert.oldPrice,
      newPrice: alert.newPrice,
      variationPercentage: alert.variationPercentage,
      variationAmount: alert.variationAmount,
      documentNumber: alert.documentNumber,
      documentDate: alert.documentDate.toISOString(),
      supplierName: alert.supplierName,
      alertType: alert.alertType.toLowerCase() as any,
      severity: alert.severity.toLowerCase() as any,
      isProcessed: alert.isProcessed,
      notes: alert.notes,
      createdAt: alert.createdAt.toISOString()
    }));
  }

  /**
   * Obtiene el historial de precios de un producto
   */
  async getProductPriceHistory(productId: string): Promise<any[]> {
    return prisma.productPriceHistory.findMany({
      where: { productId },
      orderBy: { documentDate: 'desc' }
    });
  }
}

export const priceAnalysisService = new PriceAnalysisService();
