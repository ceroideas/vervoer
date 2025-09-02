"use client"

import { useState } from 'react'
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
}

interface EditProductModalProps {
  product: HoldedProduct;
  onProductUpdated: () => void;
}

export function EditProductModal({ product, onProductUpdated }: EditProductModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price.toString(),
    cost: product.cost.toString(),
    sku: product.sku || '',
    category: product.category || ''
  })

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
        toast.success('Producto actualizado exitosamente')
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Modifica los datos del producto en Holded. Los cambios se guardarán automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Precio *</Label>
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
              <Label htmlFor="cost">Costo</Label>
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
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="Categoría"
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
            <Button type="submit" disabled={isLoading}>
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
      </DialogContent>
    </Dialog>
  )
}
