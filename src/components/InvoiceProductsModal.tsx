"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Eye, CheckCircle } from 'lucide-react'
import { CreateProductModal } from './CreateProductModal'

import { ExtractedData } from '@/types/invoice'

interface InvoiceProductsModalProps {
  extractedData?: ExtractedData;
  documentName?: string;
}

export function InvoiceProductsModal({ extractedData, documentName }: InvoiceProductsModalProps) {
  const [open, setOpen] = useState(false)

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return 'N/A'
    return new Intl.NumberFormat('es-ES').format(num)
  }

  const getDocumentTypeLabel = (type: string) => {
    return type === 'invoice' ? 'Factura' : 'Albarán'
  }

  const getDocumentTypeColor = (type: string) => {
    return type === 'invoice' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Ver Productos ({extractedData?.items?.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Extraídos
          </DialogTitle>
          <DialogDescription>
            Productos detectados en {documentName || 'el documento'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del documento */}
          {extractedData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Documento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getDocumentTypeColor(extractedData.documentType)}>
                    {getDocumentTypeLabel(extractedData.documentType)}
                  </Badge>
                  {extractedData.documentNumber && (
                    <span className="text-sm text-gray-600">
                      Nº {extractedData.documentNumber}
                    </span>
                  )}
                </div>
                
                {extractedData.supplier?.name && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Proveedor:</span>
                    <span>{extractedData.supplier.name}</span>
                  </div>
                )}
                
                {extractedData.date && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Fecha:</span>
                    <span>{extractedData.date}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lista de productos */}
          {extractedData?.items && extractedData.items.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Productos Detectados ({extractedData.items.length})</span>
                  <Badge variant="outline" className="text-sm">
                    {extractedData.items.length} productos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extractedData.items.map((item, index) => (
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
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
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
                              tags: extractedData.supplier?.name || ''
                            }}
                            onProductCreated={() => {
                              // Producto creado exitosamente
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
          {extractedData?.totals && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Totales del Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                                     {extractedData.totals.subtotal !== undefined && (
                     <div className="flex justify-between items-center">
                       <span className="font-medium">Base Imponible:</span>
                       <span className="font-mono text-lg">
                         {formatCurrency(extractedData.totals.subtotal)}
                       </span>
                     </div>
                   )}
                   
                   {extractedData.totals.discount !== undefined && extractedData.totals.discount > 0 && (
                     <div className="flex justify-between items-center">
                       <span className="font-medium text-red-600">Descuento:</span>
                       <span className="font-mono text-red-600">
                         -{formatCurrency(extractedData.totals.discount)}
                       </span>
                     </div>
                   )}
                   
                   {extractedData.totals.tax !== undefined && (
                     <div className="flex justify-between items-center">
                       <span className="font-medium">IVA:</span>
                       <span className="font-mono">
                         {formatCurrency(extractedData.totals.tax)}
                       </span>
                     </div>
                   )}
                  
                  {extractedData.totals.total !== undefined && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-bold text-lg">TOTAL:</span>
                      <span className="font-mono font-bold text-lg text-green-600">
                        {formatCurrency(extractedData.totals.total)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </Button>
            {extractedData?.items && extractedData.items.length > 0 && (
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
