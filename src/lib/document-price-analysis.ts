import { prisma } from '@/lib/prisma';
import { holdedClient } from '@/holded/client';

export interface PriceAnalysisResult {
  hasPriceVariation: boolean;
  alertType: 'price_increase' | 'price_decrease' | 'discount_anomaly' | 'normal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  oldPrice?: number;
  newPrice: number;
  variationPercentage: number;
  variationAmount: number;
  message: string;
  existingProduct?: any;
  isInHolded: boolean;
  holdedProduct?: any;
}

export interface DocumentItemAnalysis {
  itemIndex: number;
  item: any;
  priceAnalysis: PriceAnalysisResult;
}

export class DocumentPriceAnalysisService {
  private config = {
    maxPriceIncreasePercentage: 10.0,
    criticalPriceIncreasePercentage: 25.0,
    normalDiscountPercentage: 15.0, // Descuento normal hasta 15%
    anomalousDiscountPercentage: 60.0, // Descuento anómalo de 15% a 60%
    enableAutomaticUpdates: false,
    enablePriceHistory: true
  };

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const config = await prisma.priceAlertConfig.findFirst();
      if (config) {
        this.config = {
          maxPriceIncreasePercentage: config.maxPriceIncreasePercentage,
          normalDiscountPercentage: config.minDiscountPercentage, // Usar el campo existente
          anomalousDiscountPercentage: config.maxDiscountPercentage, // Usar el campo existente
          criticalPriceIncreasePercentage: config.criticalPriceIncreasePercentage,
          enableAutomaticUpdates: config.enableAutomaticUpdates,
          enablePriceHistory: config.enablePriceHistory
        };
      }
    } catch (error) {
      // Error cargando configuración de alertas
    }
  }

  /**
   * Analiza todos los items de un documento
   */
  async analyzeDocumentItems(documentItems: any[]): Promise<DocumentItemAnalysis[]> {
    const analyses: DocumentItemAnalysis[] = [];

    for (let i = 0; i < documentItems.length; i++) {
      const item = documentItems[i];
      const priceAnalysis = await this.analyzeItem(item);
      
      analyses.push({
        itemIndex: i,
        item,
        priceAnalysis
      });
    }

    return analyses;
  }

  /**
   * Analiza un item individual del documento
   */
  async analyzeItem(item: any): Promise<PriceAnalysisResult> {
    const newPrice = item.unitPrice || 0;
    const reference = item.reference;
    const description = item.description;

    // Buscar producto existente en la base de datos
    const existingProduct = await this.findExistingProduct(reference, description);
    
    // Buscar producto en Holded
    const holdedProduct = await this.findHoldedProduct(reference, description);

    if (!existingProduct && !holdedProduct) {
      // Producto nuevo - no hay variación de precio
      return {
        hasPriceVariation: false,
        alertType: 'normal',
        severity: 'low',
        newPrice,
        variationPercentage: 0,
        variationAmount: 0,
        message: 'Producto nuevo - no hay precio anterior para comparar',
        isInHolded: false
      };
    }

    // Usar el producto existente (prioridad a la base de datos local)
    const productToCompare = existingProduct || holdedProduct;
    const oldPrice = productToCompare.price || productToCompare.unitPrice || 0;

    if (oldPrice === 0) {
      return {
        hasPriceVariation: false,
        alertType: 'normal',
        severity: 'low',
        newPrice,
        variationPercentage: 0,
        variationAmount: 0,
        message: 'Producto encontrado pero sin precio anterior',
        existingProduct,
        isInHolded: !!holdedProduct,
        holdedProduct
      };
    }

    // Calcular variación de precio
    const variationAmount = newPrice - oldPrice;
    const variationPercentage = (variationAmount / oldPrice) * 100;

    // Determinar tipo de alerta y severidad
    const { alertType, severity, message } = this.determineAlertType(
      variationAmount,
      variationPercentage,
      item.discount
    );

    return {
      hasPriceVariation: alertType !== 'normal',
      alertType,
      severity,
      oldPrice,
      newPrice,
      variationPercentage,
      variationAmount,
      message,
      existingProduct,
      isInHolded: !!holdedProduct,
      holdedProduct
    };
  }

  /**
   * Busca un producto existente en la base de datos local
   */
  private async findExistingProduct(reference?: string, description?: string): Promise<any> {
    if (!reference && !description) return null;

    // Buscar por SKU/referencia exacta
    if (reference) {
      const productBySku = await prisma.product.findFirst({
        where: { sku: reference }
      });
      if (productBySku) return productBySku;
    }

    // Buscar por nombre similar
    if (description) {
      const products = await prisma.product.findMany({
        where: {
          name: {
            contains: description,
            mode: 'insensitive'
          }
        }
      });

      if (products.length > 0) {
        // Retornar el más similar
        return products[0];
      }
    }

    return null;
  }

  /**
   * Busca un producto en Holded
   */
  private async findHoldedProduct(reference?: string, description?: string): Promise<any> {
    try {
      const holdedProducts = await holdedClient.getProducts();
      
      // Buscar por SKU/referencia
      if (reference) {
        const productBySku = holdedProducts.find(p => 
          p.sku?.toLowerCase() === reference.toLowerCase()
        );
        if (productBySku) return productBySku;
      }

      // Buscar por nombre
      if (description) {
        const productByName = holdedProducts.find(p => 
          p.name?.toLowerCase().includes(description.toLowerCase())
        );
        if (productByName) return productByName;
      }

      return null;
    } catch (error) {
      // Error buscando producto en Holded
      return null;
    }
  }

  /**
   * Determina el tipo de alerta y severidad
   */
  private determineAlertType(
    variationAmount: number,
    variationPercentage: number,
    discount?: number
  ): { alertType: PriceAnalysisResult['alertType']; severity: PriceAnalysisResult['severity']; message: string } {
    
    // Verificar descuento anómalo
    if (discount && discount > 0) {
      if (discount > this.config.normalDiscountPercentage && discount <= this.config.anomalousDiscountPercentage) {
        // Descuento anómalo: entre 15% y 60%
        return {
          alertType: 'discount_anomaly',
          severity: 'medium',
          message: `Descuento anómalo detectado: ${discount}% (rango normal: 0%-${this.config.normalDiscountPercentage}%)`
        };
      } else if (discount > this.config.anomalousDiscountPercentage) {
        // Descuento crítico: más de 60%
        return {
          alertType: 'discount_anomaly',
          severity: 'high',
          message: `Descuento crítico detectado: ${discount}% (descuento muy alto)`
        };
      }
    }

    // Verificar variación de precio
    if (variationAmount > 0) {
      // Aumento de precio
      if (variationPercentage > this.config.criticalPriceIncreasePercentage) {
        return {
          alertType: 'price_increase',
          severity: 'critical',
          message: `Aumento crítico de precio: +${variationPercentage.toFixed(1)}% (${variationAmount.toFixed(2)}€)`
        };
      } else if (variationPercentage > this.config.maxPriceIncreasePercentage) {
        return {
          alertType: 'price_increase',
          severity: 'high',
          message: `Aumento significativo de precio: +${variationPercentage.toFixed(1)}% (${variationAmount.toFixed(2)}€)`
        };
      } else {
        return {
          alertType: 'price_increase',
          severity: 'medium',
          message: `Aumento de precio: +${variationPercentage.toFixed(1)}% (${variationAmount.toFixed(2)}€)`
        };
      }
    } else if (variationAmount < 0) {
      // Disminución de precio
      const decreasePercentage = Math.abs(variationPercentage);
      return {
        alertType: 'price_decrease',
        severity: 'low',
        message: `Disminución de precio: -${decreasePercentage.toFixed(1)}% (${Math.abs(variationAmount).toFixed(2)}€)`
      };
    }

    return {
      alertType: 'normal',
      severity: 'low',
      message: 'Precio normal - sin variaciones significativas'
    };
  }

  /**
   * Guarda una alerta de precio en la base de datos
   */
  async savePriceAlert(
    productId: string,
    productName: string,
    productSku: string,
    oldPrice: number,
    newPrice: number,
    variationPercentage: number,
    variationAmount: number,
    documentNumber: string,
    documentDate: Date,
    supplierName: string,
    alertType: string,
    severity: string
  ): Promise<void> {
    try {
      await prisma.priceVariation.create({
        data: {
          productId,
          productName,
          productSku,
          oldPrice,
          newPrice,
          variationPercentage,
          variationAmount,
          documentNumber,
          documentDate,
          supplierName,
          alertType: alertType.toUpperCase() as any,
          severity: severity.toUpperCase() as any,
          isProcessed: false
        }
      });
    } catch (error) {
      // Error guardando alerta de precio
    }
  }
}

export const documentPriceAnalysisService = new DocumentPriceAnalysisService();
