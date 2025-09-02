"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
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

interface DeleteProductModalProps {
  product: HoldedProduct;
  onProductDeleted: () => void;
}

export function DeleteProductModal({ product, onProductDeleted }: DeleteProductModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/holded/products/${product.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Producto eliminado exitosamente')
        setOpen(false)
        onProductDeleted()
      } else {
        toast.error(result.error || 'Error al eliminar el producto')
      }
    } catch (error) {
      console.error('Error eliminando producto:', error)
      toast.error('Error al eliminar el producto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Producto
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="space-y-2">
            <h4 className="font-medium text-red-800">{product.name}</h4>
            {product.sku && (
              <p className="text-sm text-red-600">SKU: {product.sku}</p>
            )}
            {product.description && (
              <p className="text-sm text-red-600 line-clamp-2">{product.description}</p>
            )}
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Producto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
