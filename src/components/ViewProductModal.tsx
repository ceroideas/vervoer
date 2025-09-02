"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Eye, Loader2, Package, Tag, Euro, Hash, FileText } from 'lucide-react'

interface HoldedProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  sku?: string;
  category?: string;
}

interface ViewProductModalProps {
  product: HoldedProduct;
}

export function ViewProductModal({ product }: ViewProductModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [productDetails, setProductDetails] = useState<HoldedProduct | null>(null)

  const loadProductDetails = async () => {
    if (!open) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/holded/products/${product.id}`)
      const result = await response.json()
      
      if (result.success) {
        setProductDetails(result.product)
      } else {
        console.error('Error cargando detalles del producto:', result.error)
      }
    } catch (error) {
      console.error('Error cargando detalles del producto:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadProductDetails()
    }
  }, [open])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const displayProduct = productDetails || product

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalles del Producto
          </DialogTitle>
          <DialogDescription>
            Información completa del producto en Holded
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando detalles...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{displayProduct.name}</h3>
                {displayProduct.description && (
                  <p className="text-gray-600 text-sm">{displayProduct.description}</p>
                )}
              </div>

              {/* SKU y Categoría */}
              <div className="flex flex-wrap gap-2">
                {displayProduct.sku && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    SKU: {displayProduct.sku}
                  </Badge>
                )}
                {displayProduct.category && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {displayProduct.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Precios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Euro className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Precio de Venta</span>
                </div>
                <p className="text-xl font-bold text-blue-800">
                  {formatCurrency(displayProduct.price)}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Costo</span>
                </div>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(displayProduct.cost)}
                </p>
              </div>
            </div>

            {/* Margen */}
            {displayProduct.cost > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Margen de Beneficio</span>
                  <Badge variant="secondary">
                    {((displayProduct.price - displayProduct.cost) / displayProduct.price * 100).toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {formatCurrency(displayProduct.price - displayProduct.cost)}
                </p>
              </div>
            )}

            {/* Información adicional */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Información Técnica</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>ID:</strong> {displayProduct.id}</p>
                <p><strong>Tipo:</strong> Producto Simple</p>
                <p><strong>Moneda:</strong> EUR</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
