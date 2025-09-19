"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  Calendar,
  User,
  Euro,
  Package
} from 'lucide-react'
import { toast } from 'sonner'

interface HoldedDocument {
  id: string
  contact: string
  contactName: string
  desc: string
  date: number
  dueDate: number | null
  notes: string | null
  tags: string[]
  products: Array<{
    name: string
    desc: string
    price: number
    units: number
    tax: number
    taxes: string[]
    tags: string[]
    discount: number
    retention: number
    weight: number
    costPrice: number
    sku: number
    account: string
  }>
  tax: number
  subtotal: number
  discount: number
  total: number
  language: string
  status: number
  customFields: any[]
  docNumber: string | null
  currency: string
  currencyChange: number
  paymentsTotal: number
  paymentsPending: number
  paymentsRefunds: number
  docType?: 'invoice' | 'waybill'
}

interface HoldedDocumentsListProps {
  docType?: 'invoice' | 'waybill' | 'all'
}

export function HoldedDocumentsList({ docType = 'all' }: HoldedDocumentsListProps) {
  const [documents, setDocuments] = useState<HoldedDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<HoldedDocument | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)


  const loadDocuments = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const url = docType === 'all' 
        ? '/api/holded/documents'
        : `/api/holded/documents?type=${docType}`
        
      console.log('🔍 Cargando documentos desde:', url)
      const response = await fetch(url)
      const result = await response.json()
      
      console.log('📄 Respuesta de la API:', result)
      
      if (result.success) {
        setDocuments(result.documents || [])
        console.log('✅ Documentos cargados:', result.documents?.length || 0)
      } else {
        setError('Error cargando documentos')
        console.error('❌ Error en la respuesta:', result.error)
      }
    } catch (error) {
      setError('Error de conexión')
      console.error('❌ Error de conexión:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDocument = async (document: HoldedDocument) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar este ${docType === 'invoice' ? 'factura' : 'albarán'}?`)) {
      return
    }

    setIsDeleting(document.id)
    
    try {
      // Usar el docType del prop (pestaña seleccionada) en lugar del campo del documento
      const response = await fetch(`/api/holded/documents/${docType}/${document.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Documento eliminado exitosamente')
        await loadDocuments() // Recargar la lista
      } else {
        toast.error(result.error || 'Error eliminando documento')
      }
    } catch (error) {
      toast.error('Error eliminando documento')
    } finally {
      setIsDeleting(null)
    }
  }


  const downloadPDF = async (doc: HoldedDocument) => {
    setIsDownloading(doc.id)
    
    try {
      // Usar el docType del prop (pestaña seleccionada) en lugar del campo del documento
      const response = await fetch(`/api/holded/documents/${docType}/${doc.id}/pdf`)
      
      if (response.ok) {
        // Si es un PDF, descargarlo directamente
        if (response.headers.get('content-type')?.includes('application/pdf')) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${docType}-${doc.id}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          toast.success('PDF descargado exitosamente')
        } else {
          // Si es JSON, puede ser un error o datos base64
          const result = await response.json()
          console.log('Respuesta completa del servidor:', result)
          console.log('Status:', result.status)
          console.log('Data presente:', !!result.data)
          console.log('Data length:', result.data?.length)
          
          if (result.status === 1 && result.data) {
            try {
              // Decodificar base64 y crear blob
              const binaryString = atob(result.data)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              const blob = new Blob([bytes], { type: 'application/pdf' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${docType}-${doc.id}.pdf`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
              toast.success('PDF descargado exitosamente')
            } catch (base64Error) {
              console.error('Error decodificando base64:', base64Error)
              toast.error('Error al procesar el PDF')
            }
          } else if (result.status === 0) {
            // Error de Holded API
            console.error('Error de Holded API:', result.info || result.message)
            toast.error(`Error de Holded: ${result.info || result.message || 'Error desconocido'}`)
          } else if (result.error) {
            // Error de nuestra API
            console.error('Error de nuestra API:', result.error)
            toast.error(`Error: ${result.error}`)
          } else {
            console.error('Respuesta inesperada:', result)
            console.error('Tipo de respuesta:', typeof result)
            console.error('Claves de la respuesta:', Object.keys(result))
            toast.error('Error al descargar el PDF - respuesta inesperada')
          }
        }
      } else {
        const result = await response.json()
        toast.error(result.error || 'Error descargando PDF')
      }
    } catch (error) {
      toast.error('Error descargando PDF')
    } finally {
      setIsDownloading(null)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES')
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="outline" className="text-yellow-600">Borrador</Badge>
      case 1:
        return <Badge variant="outline" className="text-blue-600">Enviado</Badge>
      case 2:
        return <Badge variant="outline" className="text-green-600">Pagado</Badge>
      case 3:
        return <Badge variant="outline" className="text-red-600">Vencido</Badge>
      case 4:
        return <Badge variant="outline" className="text-gray-600">Cancelado</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [docType])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {docType === 'all' ? 'Documentos de Holded' : 
           docType === 'invoice' ? 'Facturas de Holded' : 'Albaranes de Holded'}
        </CardTitle>
        <CardDescription>
          {docType === 'all' ? 'Facturas y albaranes desde Holded' : 
           docType === 'invoice' ? 'Facturas disponibles en Holded' : 'Albaranes disponibles en Holded'}
        </CardDescription>
        <Button onClick={loadDocuments} disabled={isLoading} size="sm" variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Cargando documentos...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-700">{error}</span>
            <Button size="sm" variant="outline" onClick={loadDocuments}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Lista de documentos */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay documentos disponibles
              </p>
            ) : (
              documents.map((document) => (
                <div key={document.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(document.status)}
                      <Badge variant="secondary">
                        {docType === 'invoice' ? 'Factura' : 'Albarán'}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {document.docNumber || `Doc-${document.id.slice(-8)}`}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{document.contactName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          {formatDate(document.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 flex-shrink-0" />
                          {document.products.length} productos
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="font-medium text-green-600">
                        {formatCurrency(document.total, document.currency)}
                      </p>
                      {document.paymentsPending > 0 && (
                        <p className="text-xs text-red-600">
                          Pendiente: {formatCurrency(document.paymentsPending, document.currency)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 justify-end sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(document)
                          setIsModalOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPDF(document)}
                        disabled={isDownloading === document.id}
                      >
                        {isDownloading === document.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(document)}
                        disabled={isDeleting === document.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isDeleting === document.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-600">
            {documents.length} documentos total
          </span>
        </div>
      </CardContent>

      {/* Modal de detalles del documento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>
              {docType === 'invoice' ? 'Factura' : 'Albarán'} - {selectedDocument?.docNumber || `Doc-${selectedDocument?.id.slice(-8)}`}
            </DialogTitle>
            <DialogDescription>
              Detalles del documento desde Holded
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Información del Documento</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {selectedDocument.id}</p>
                    <p><strong>Número:</strong> {selectedDocument.docNumber || 'No especificado'}</p>
                    <p><strong>Fecha:</strong> {formatDate(selectedDocument.date)}</p>
                    {selectedDocument.dueDate && (
                      <p><strong>Vencimiento:</strong> {formatDate(selectedDocument.dueDate)}</p>
                    )}
                    <p><strong>Estado:</strong> {getStatusBadge(selectedDocument.status)}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Contacto</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nombre:</strong> {selectedDocument.contactName}</p>
                    <p><strong>ID:</strong> {selectedDocument.contact}</p>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-2">
                <h4 className="font-medium">Productos ({selectedDocument.products.length})</h4>
                <div className="space-y-2">
                  {selectedDocument.products.map((product, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-words">{product.name}</p>
                          {product.desc && <p className="text-sm text-muted-foreground break-words">{product.desc}</p>}
                          <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground mt-1">
                            <span>Cantidad: {product.units}</span>
                            <span>Precio: {formatCurrency(product.price, selectedDocument.currency)}</span>
                            <span>IVA: {product.tax}%</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <p className="font-medium">
                            {formatCurrency(product.price * product.units, selectedDocument.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedDocument.subtotal, selectedDocument.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span>{formatCurrency(selectedDocument.tax, selectedDocument.currency)}</span>
                  </div>
                  {selectedDocument.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Descuento:</span>
                      <span>-{formatCurrency(selectedDocument.discount, selectedDocument.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedDocument.total, selectedDocument.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Pagos */}
              {(selectedDocument.paymentsTotal > 0 || selectedDocument.paymentsPending > 0) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Estado de Pagos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="font-medium text-green-600">Pagado</p>
                      <p>{formatCurrency(selectedDocument.paymentsTotal, selectedDocument.currency)}</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="font-medium text-yellow-600">Pendiente</p>
                      <p>{formatCurrency(selectedDocument.paymentsPending, selectedDocument.currency)}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="font-medium text-red-600">Reembolsos</p>
                      <p>{formatCurrency(selectedDocument.paymentsRefunds, selectedDocument.currency)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedDocument.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notas</h4>
                  <p className="text-sm text-muted-foreground">{selectedDocument.notes}</p>
                </div>
              )}

              {/* Tags */}
              {selectedDocument.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
