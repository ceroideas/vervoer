"use client"

import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { 
  Building2, 
  Package, 
  FileText, 
  Search, 
  RefreshCw, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { CreateProductModal } from '@/components/CreateProductModal'
import { CreateContactModal } from '@/components/CreateContactModal'
import { CreateInvoiceModal } from '@/components/CreateInvoiceModal'
import { ViewProductModal } from '@/components/ViewProductModal'
import { EditProductModal } from '@/components/EditProductModal'
import { DeleteProductModal } from '@/components/DeleteProductModal'
import { HoldedDocumentsList } from '@/components/HoldedDocumentsList'
import { PriceAlertsPanel } from '@/components/PriceAlertsPanel'
import { ProductPriceHistory } from '@/components/ProductPriceHistory'

interface HoldedProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  sku?: string;
  category?: string;
}

interface HoldedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  type: 'customer' | 'supplier' | 'both';
}

interface HoldedInvoice {
  id: string;
  number?: string;
  date: string;
  contactId: string;
  contactName?: string;
  items?: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
}

type DataType = 'products' | 'contacts' | 'invoices' | 'waybills';

export default function HoldedPage() {
  const [dataType, setDataType] = useState<DataType>('products')
  const [products, setProducts] = useState<HoldedProduct[]>([])
  const [contacts, setContacts] = useState<HoldedContact[]>([])
  const [invoices, setInvoices] = useState<HoldedInvoice[]>([])
  const [waybills, setWaybills] = useState<HoldedInvoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [stats, setStats] = useState({ products: 0, contacts: 0, invoices: 0, waybills: 0 })

  // Cargar datos de Holded
  const loadHoldedData = async () => {
    setIsLoading(true)
    try {
      // Probar conexión
      const testResponse = await fetch('/api/holded/test')
      const testResult = await testResponse.json()
      
      if (testResult.success) {
        setConnectionStatus('connected')
        setStats({
          products: testResult.data.products,
          contacts: testResult.data.contacts,
          invoices: testResult.data.invoices,
          waybills: testResult.data.waybills || 0
        })
      } else {
        setConnectionStatus('disconnected')
        return
      }

      // Cargar productos
      const productsResponse = await fetch('/api/holded/products')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])
      }

      // Cargar contactos
      const contactsResponse = await fetch('/api/holded/contacts')
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        setContacts(contactsData.contacts || [])
      }

      // Cargar facturas
      const invoicesResponse = await fetch('/api/holded/invoices')
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData.invoices || [])
      }

      // Cargar albaranes
      const waybillsResponse = await fetch('/api/holded/waybills')
      if (waybillsResponse.ok) {
        const waybillsData = await waybillsResponse.json()
        setWaybills(waybillsData.waybills || [])
      }

    } catch (error) {
      console.error('Error cargando datos de Holded:', error)
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHoldedData()
  }, [])

  // Filtrar datos según el término de búsqueda
  const getFilteredData = () => {
    const term = searchTerm.toLowerCase()
    
    switch (dataType) {
      case 'products':
        return products.filter(product => 
          product.name.toLowerCase().includes(term) ||
          product.sku?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)
        )
      case 'contacts':
        return contacts.filter(contact => 
          contact.name.toLowerCase().includes(term) ||
          contact.taxId?.includes(term) ||
          contact.email?.toLowerCase().includes(term)
        )
      case 'invoices':
        return invoices.filter(invoice => 
          invoice.number?.toLowerCase().includes(term) ||
          invoice.contactName?.toLowerCase().includes(term)
        )
      case 'waybills':
        return waybills.filter(waybill => 
          waybill.number?.toLowerCase().includes(term) ||
          waybill.contactName?.toLowerCase().includes(term)
        )
      default:
        return []
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'supplier': return 'bg-orange-100 text-orange-800'
      case 'customer': return 'bg-blue-100 text-blue-800'
      case 'both': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredData = getFilteredData()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Holded</h1>
            <p className="text-gray-600">Administra productos, contactos y facturas de Holded</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </>
              ) : connectionStatus === 'checking' ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
                         <Button onClick={loadHoldedData} disabled={isLoading}>
               <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
               {isLoading ? 'Cargando...' : 'Actualizar'}
             </Button>
             
                           

          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos</p>
                  <p className="text-2xl font-bold">{stats.products}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contactos</p>
                  <p className="text-2xl font-bold">{stats.contacts}</p>
                </div>
                <Building2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Facturas</p>
                  <p className="text-2xl font-bold">{stats.invoices}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Albaranes</p>
                  <p className="text-2xl font-bold">{stats.waybills}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Alertas de Precios */}
        <PriceAlertsPanel onProductUpdate={loadHoldedData} />

        {/* Navegación por tipo de datos */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Button
                variant={dataType === 'products' ? 'default' : 'outline'}
                onClick={() => setDataType('products')}
                className="flex items-center justify-center gap-1 sm:gap-2"
              >
                <Package className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Productos</span>
              </Button>
              <Button
                variant={dataType === 'contacts' ? 'default' : 'outline'}
                onClick={() => setDataType('contacts')}
                className="flex items-center justify-center gap-1 sm:gap-2"
              >
                <Building2 className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Contactos</span>
              </Button>
              <Button
                variant={dataType === 'invoices' ? 'default' : 'outline'}
                onClick={() => setDataType('invoices')}
                className="flex items-center justify-center gap-1 sm:gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Facturas</span>
              </Button>
              <Button
                variant={dataType === 'waybills' ? 'default' : 'outline'}
                onClick={() => setDataType('waybills')}
                className="flex items-center justify-center gap-1 sm:gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Albaranes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Búsqueda y acciones */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={`Buscar ${dataType === 'products' ? 'productos' : dataType === 'contacts' ? 'contactos' : dataType === 'invoices' ? 'facturas' : 'albaranes'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {dataType === 'products' ? (
                <CreateProductModal onProductCreated={loadHoldedData} />
              ) : dataType === 'contacts' ? (
                <CreateContactModal onContactCreated={loadHoldedData} />
              ) : dataType === 'invoices' ? (
                <CreateInvoiceModal onInvoiceCreated={loadHoldedData} docType="invoice" />
              ) : (
                <CreateInvoiceModal onInvoiceCreated={loadHoldedData} docType="waybill" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de datos */}
        <Card>
          <CardHeader>
            <CardTitle>
              {dataType === 'products' ? 'Productos' : dataType === 'contacts' ? 'Contactos' : dataType === 'invoices' ? 'Facturas' : 'Albaranes'} 
              ({filteredData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionStatus === 'disconnected' ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">No se pudo conectar con Holded</p>
                <Button onClick={loadHoldedData} className="mt-4">
                  Reintentar conexión
                </Button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No se encontraron {dataType === 'products' ? 'productos' : dataType === 'contacts' ? 'contactos' : dataType === 'invoices' ? 'facturas' : 'albaranes'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dataType === 'products' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(filteredData as HoldedProduct[]).map((product: HoldedProduct) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium truncate">{product.name}</h3>
                            <div className="flex space-x-1">
                              <ViewProductModal product={product} />
                              <EditProductModal product={product} onProductUpdated={loadHoldedData} />
                              <DeleteProductModal product={product} onProductDeleted={loadHoldedData} />
                              <ProductPriceHistory productId={product.id} productName={product.name} />
                            </div>
                          </div>
                          {product.sku && (
                            <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                          )}
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{formatCurrency(product.price)}</span>
                            <div className="flex items-center gap-2">
                              {product.category && (
                                <Badge variant="outline">{product.category}</Badge>
                              )}
                              {/* Indicador de alerta de precio (se puede implementar más adelante) */}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {dataType === 'contacts' && (
                  <div className="space-y-2">
                    {(filteredData as HoldedContact[]).map((contact: HoldedContact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{contact.name}</h3>
                            <Badge className={getTypeColor(contact.type)}>
                              {contact.type === 'supplier' ? 'Proveedor' : contact.type === 'customer' ? 'Cliente' : 'Ambos'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {contact.taxId && <p>CIF/NIF: {contact.taxId}</p>}
                            {contact.email && <p>Email: {contact.email}</p>}
                            {contact.phone && <p>Teléfono: {contact.phone}</p>}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dataType === 'invoices' && (
                  <HoldedDocumentsList docType="invoice" />
                )}

                {dataType === 'waybills' && (
                  <HoldedDocumentsList docType="waybill" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  )
}
