"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  FileText,
  Calendar,
  Package,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Info,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react'

import { Document, ExtractedData } from '@/types/invoice'
import { InvoiceDataDisplay } from './InvoiceDataDisplay'
import { CreateProductModal } from './CreateProductModal'
import { PriceAlertBadge } from './PriceAlertBadge'
import { PriceAlertDetails } from './PriceAlertDetails'
import { DocumentItemAnalysis, PriceAnalysisResult } from '@/lib/document-price-analysis'

interface DocumentDetailsModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
}

export function DocumentDetailsModal({ document, isOpen, onClose }: DocumentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [priceAnalyses, setPriceAnalyses] = useState<DocumentItemAnalysis[]>([])
  const [isAnalyzingPrices, setIsAnalyzingPrices] = useState(false)
  const [priceAnalysisCompleted, setPriceAnalysisCompleted] = useState(false)
  const [alertCounts, setAlertCounts] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  })

  if (!document) return null

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return 'N/A'
    return new Intl.NumberFormat('es-ES').format(num)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed': return 'Procesado'
      case 'processing': return 'Procesando'
      case 'error': return 'Error'
      default: return 'Desconocido'
    }
  }

  const getDocumentTypeText = (type: string) => {
    switch (type) {
      case 'invoice': return 'Factura'
      case 'delivery_note': return 'Albarán'
      case 'receipt': return 'Recibo'
      default: return 'Documento'
    }
  }

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'bg-blue-100 text-blue-800'
      case 'delivery_note': return 'bg-green-100 text-green-800'
      case 'receipt': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const analyzePrices = async () => {
    if (!document?.extractedData?.items || document.extractedData.items.length === 0) {
      return;
    }

    setIsAnalyzingPrices(true);
    try {
      const response = await fetch('/api/documents/analyze-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: document.extractedData.items,
          documentNumber: document.extractedData.documentNumber || document.name,
          documentDate: document.extractedData.date || new Date().toISOString(),
          supplierName: document.extractedData.supplier?.name || 'Proveedor desconocido'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setPriceAnalyses(result.analyses);
        setAlertCounts(result.alertCounts);
        setPriceAnalysisCompleted(true);
        // Análisis de precios completado
      } else {
        console.error('❌ Error en análisis de precios:', result.error);
      }
    } catch (error) {
      console.error('❌ Error analizando precios:', error);
    } finally {
      setIsAnalyzingPrices(false);
    }
  };

  const getPriceAnalysisForItem = (itemIndex: number): PriceAnalysisResult | null => {
    const analysis = priceAnalyses.find(a => a.itemIndex === itemIndex);
    return analysis?.priceAnalysis || null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {document.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getDocumentTypeColor(document.extractedData?.documentType || 'unknown')}>
                    {getDocumentTypeText(document.extractedData?.documentType || 'unknown')}
                  </Badge>
                  <Badge className={getStatusColor(document.status)}>
                    {getStatusText(document.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {document.extractedData ? (
              <InvoiceDataDisplay
                data={document.extractedData}
                ocrData={document.ocrData}
                gptData={document.gptData}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay datos extraídos disponibles</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {document.extractedData ? (
              <>
                {/* Información del documento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Documento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getDocumentTypeColor(document.extractedData?.documentType || 'unknown')}>
                        {getDocumentTypeText(document.extractedData?.documentType || 'unknown')}
                      </Badge>
                      {document.extractedData?.documentNumber && (
                        <span className="text-sm text-gray-600">
                          Nº {document.extractedData.documentNumber}
                        </span>
                      )}
                    </div>
                    
                    {document.extractedData?.supplier?.name && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Proveedor:</span>
                        <span>{document.extractedData.supplier.name}</span>
                      </div>
                    )}
                    
                    {document.extractedData?.date && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Fecha:</span>
                        <span>{document.extractedData.date}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lista de productos */}
                {document.extractedData?.items && document.extractedData.items.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">
                            Productos Detectados ({document.extractedData.items.length})
                          </CardTitle>
                          <Badge variant="outline" className="text-sm">
                            {document.extractedData.items.length} productos
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {priceAnalysisCompleted && alertCounts.total > 0 && (
                            <div className="flex items-center gap-1">
                              <Badge variant="destructive" className="text-xs">
                                {alertCounts.critical + alertCounts.high} Críticas
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {alertCounts.medium + alertCounts.low} Alertas
                              </Badge>
                            </div>
                          )}
                          <Button
                            onClick={analyzePrices}
                            disabled={isAnalyzingPrices}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            {isAnalyzingPrices ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                Analizando...
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-4 w-4" />
                                Analizar Precios
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {document.extractedData?.items?.map((item, index) => {
                          const priceAnalysis = getPriceAnalysisForItem(index);
                          return (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="font-medium text-lg">
                                    {item.description || `Producto ${index + 1}`}
                                  </span>
                                  {item.reference && (
                                    <Badge variant="outline" className="text-xs">
                                      Ref: {item.reference}
                                    </Badge>
                                  )}
                                  {priceAnalysis && (
                                    <PriceAlertBadge analysis={priceAnalysis} />
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Cantidad:</span>
                                    <span className="font-mono">{formatNumber(item.quantity)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Precio Unitario:</span>
                                    <span className="font-mono text-green-600">{formatCurrency(item.unitPrice)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Descuento:</span>
                                    <span className="font-mono text-red-600">
                                      {item.discount ? (
                                        item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)
                                      ) : '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Total Línea:</span>
                                    <span className="font-mono font-semibold text-blue-600">{formatCurrency(item.totalPrice)}</span>
                                  </div>
                                </div>
                                
                                {/* Detalles de alerta de precio */}
                                {priceAnalysis && priceAnalysis.hasPriceVariation && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <PriceAlertDetails analysis={priceAnalysis} item={item} />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                {priceAnalysis && priceAnalysis.isInHolded ? (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    Ya en Holded
                                  </Badge>
                                ) : (
                                  <CreateProductModal 
                                    prefillData={{
                                      name: item.description || `Producto ${index + 1}`,
                                      description: item.description || '',
                                      price: item.unitPrice || 0,
                                      cost: item.unitPrice || 0, // Usar precio unitario como costo
                                      sku: item.reference || '',
                                      tax: 21, // IVA por defecto en España
                                      stock: item.quantity || 0,
                                      weight: 0,
                                      barcode: item.reference || '',
                                      tags: document.extractedData?.supplier?.name || ''
                                    }}
                                    onProductCreated={() => {
                                      // Producto creado exitosamente
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se detectaron productos</h3>
                        <p className="text-gray-500">
                          No se pudieron extraer productos de este documento. Intenta con una imagen más clara.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Totales del documento */}
                {document.extractedData?.totals && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Totales del Documento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {document.extractedData?.totals?.subtotal !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Base Imponible:</span>
                            <span className="font-mono text-lg">
                              {formatCurrency(document.extractedData.totals.subtotal)}
                            </span>
                          </div>
                        )}
                        
                        {document.extractedData?.totals?.discount !== undefined && document.extractedData.totals.discount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-red-600">Descuento:</span>
                            <span className="font-mono text-red-600">
                              -{formatCurrency(document.extractedData.totals.discount)}
                            </span>
                          </div>
                        )}
                        
                        {document.extractedData?.totals?.tax !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">IVA:</span>
                            <span className="font-mono">
                              {formatCurrency(document.extractedData.totals.tax)}
                            </span>
                          </div>
                        )}
                       
                        {document.extractedData?.totals?.total !== undefined && (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-bold text-lg">TOTAL:</span>
                            <span className="font-mono font-bold text-lg text-green-600">
                              {formatCurrency(document.extractedData.totals.total)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Acciones */}
                {document.extractedData?.items && document.extractedData.items.length > 0 && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      onClick={() => {
                        // Aquí podrías implementar una función para crear todos los productos de una vez
                        // Crear todos los productos
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Crear Todos los Productos
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay datos extraídos disponibles</p>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
