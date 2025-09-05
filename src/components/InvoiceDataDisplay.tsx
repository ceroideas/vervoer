"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  FileText, 
  Calendar, 
  Package, 
  Euro, 
  Calculator,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

import { ExtractedData } from '@/types/invoice'

interface InvoiceDataDisplayProps {
  data: ExtractedData;
  ocrData?: ExtractedData;
  gptData?: ExtractedData;
  isLoading?: boolean;
}

export function InvoiceDataDisplay({ data, ocrData, gptData, isLoading }: InvoiceDataDisplayProps) {
  // Debug logging
  // InvoiceDataDisplay recibió datos
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Procesando documento...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
    <div className="space-y-6">
      {/* Información del documento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información del Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Badge className={getDocumentTypeColor(data.documentType)}>
                {getDocumentTypeLabel(data.documentType)}
              </Badge>
            </div>
            
            {data.documentNumber && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Número:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {data.documentNumber}
                </span>
              </div>
            )}
            
            {data.date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Fecha:</span>
                <span>{data.date}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información del proveedor */}
      {data.supplier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.supplier.name && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Nombre:</span>
                <span>{data.supplier.name}</span>
              </div>
            )}
            {data.supplier.address && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Dirección:</span>
                <span>{data.supplier.address}</span>
              </div>
            )}
            {data.supplier.taxId && (
              <div className="flex items-center gap-2">
                <span className="font-medium">CIF/NIF:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {data.supplier.taxId}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Productos */}
      {data.items && data.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos ({data.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Ref.</th>
                    <th className="text-left p-2 font-medium">Descripción</th>
                    <th className="text-right p-2 font-medium">Cantidad</th>
                    <th className="text-right p-2 font-medium">Precio Unit.</th>
                    <th className="text-right p-2 font-medium">Descuento</th>
                    <th className="text-right p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">
                        {item.reference || '-'}
                      </td>
                      <td className="p-2 max-w-xs truncate">
                        {item.description || '-'}
                      </td>
                      <td className="p-2 text-right">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {item.discount ? (
                          <span className="text-red-600">
                            {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-right font-mono font-medium">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totales */}
      {data.totals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.totals.subtotal !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Base Imponible:</span>
                  <span className="font-mono text-lg">
                    {formatCurrency(data.totals.subtotal)}
                  </span>
                </div>
              )}
              
              {data.totals.discount !== undefined && data.totals.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-red-600">Descuento:</span>
                  <span className="font-mono text-red-600">
                    -{formatCurrency(data.totals.discount)}
                  </span>
                </div>
              )}
              
              {data.totals.tax !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">IVA:</span>
                  <span className="font-mono">
                    {formatCurrency(data.totals.tax)}
                  </span>
                </div>
              )}
              
              {data.totals.total !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold text-lg">TOTAL:</span>
                  <span className="font-mono font-bold text-lg text-green-600">
                    {formatCurrency(data.totals.total)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Mensaje si no hay datos */}
      {(!data.items || data.items.length === 0) && !data.supplier && !data.documentNumber && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <span>No se pudieron extraer datos del documento. Intenta con una imagen más clara.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
