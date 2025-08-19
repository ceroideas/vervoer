"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Search, 
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

interface HoldedProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  sku?: string;
  category?: string;
}

export function HoldedProductsSummary() {
  const [products, setProducts] = useState<HoldedProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadProducts = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/holded/products')
      const result = await response.json()
      
      if (result.success) {
        setProducts(result.products || [])
      } else {
        setError('Error cargando productos')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5) // Mostrar solo los primeros 5

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Productos en Holded
        </CardTitle>
        <CardDescription>
          Productos disponibles en tu catálogo de Holded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Cargando productos...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-700">{error}</span>
            <Button size="sm" variant="outline" onClick={loadProducts}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Lista de productos */}
        {!isLoading && !error && (
          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </p>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    {product.sku && (
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    )}
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  {product.category && (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        )}

                 {/* Footer */}
         <div className="flex items-center justify-between pt-2 border-t">
           <span className="text-sm text-gray-600">
             {products.length} productos total
           </span>
           <Button size="sm" variant="outline" onClick={() => window.location.href = '/admin/holded'}>
             <ExternalLink className="h-3 w-3 mr-1" />
             Ver todos
           </Button>
         </div>
      </CardContent>
    </Card>
  )
}
