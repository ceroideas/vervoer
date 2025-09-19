"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface HoldedProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  sku?: string;
  category?: string;
  // Campos adicionales de Holded
  desc?: string; // Holded usa 'desc' en lugar de 'description'
  tax?: number;
  stock?: number;
  weight?: number;
  barcode?: string;
  tags?: string[];
  kind?: string;
  calculatecost?: number;
  purchasePrice?: number;
}

interface EditProductModalProps {
  product: HoldedProduct;
  onProductUpdated: () => void;
}

export function EditProductModal({ product, onProductUpdated }: EditProductModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [productData, setProductData] = useState<HoldedProduct | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    sku: '',
    tax: '',
    stock: '',
    weight: '',
    barcode: '',
    tags: ''
  })

  // Cargar datos reales de Holded cuando se abre el modal
  const loadProductData = async () => {
    if (!open || productData) return // Ya cargado o modal cerrado
    
    setIsLoadingData(true)
    try {
      const response = await fetch(`/api/holded/products/${product.id}`)
      const result = await response.json()
      
      if (result.success) {
        const holdedProduct = result.data.product
        setProductData(holdedProduct)
        
        // Actualizar formulario con datos reales de Holded
        setFormData({
          name: holdedProduct.name || '',
          description: holdedProduct.desc || holdedProduct.description || '',
          price: holdedProduct.price?.toString() || '',
          cost: holdedProduct.cost?.toString() || '',
          sku: holdedProduct.sku || '',
          tax: holdedProduct.tax?.toString() || '0',
          stock: holdedProduct.stock?.toString() || '0',
          weight: holdedProduct.weight?.toString() || '0',
          barcode: holdedProduct.barcode || '',
          tags: holdedProduct.tags?.join(', ') || ''
        })
      } else {
        toast.error('Error cargando datos del producto')
      }
    } catch (error) {
      console.error('Error cargando producto:', error)
      toast.error('Error cargando datos del producto')
    } finally {
      setIsLoadingData(false)
    }
  }

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadProductData()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/holded/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Producto actualizado exitosamente en Holded')
        setOpen(false)
        onProductUpdated()
      } else {
        toast.error(result.error || 'Error al actualizar el producto')
      }
    } catch (error) {
      console.error('Error actualizando producto:', error)
      toast.error('Error al actualizar el producto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Modifica los datos del producto en Holded. Los datos se cargan automáticamente desde Holded.
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando datos del producto...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información básica */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nombre del producto"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción del producto"
                rows={3}
              />
            </div>

            {/* Precios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Precio de Venta *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="cost">Costo de Compra</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* SKU y Código de Barras */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Código SKU"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Código de barras"
                />
              </div>
            </div>

            {/* Stock y Peso */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Impuestos y Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tax">IVA (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tax}
                  onChange={(e) => handleInputChange('tax', e.target.value)}
                  placeholder="21"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="etiqueta1, etiqueta2, etiqueta3"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingData}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar Producto'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
