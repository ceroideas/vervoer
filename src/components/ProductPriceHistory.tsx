"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  TrendingUp, 
  TrendingDown, 
  History, 
  Calendar,
  DollarSign,
  Package,
  FileText,
  Building2
} from 'lucide-react'

interface ProductPriceHistoryProps {
  productId: string;
  productName: string;
}

interface PriceHistoryEntry {
  id: string;
  price: number;
  cost: number;
  documentNumber: string;
  documentDate: string;
  supplierName: string;
  quantity: number;
  totalAmount: number;
  createdAt: string;
}

export function ProductPriceHistory({ productId, productName }: ProductPriceHistoryProps) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const loadHistory = async () => {
    if (!open) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/price-alerts/history/${productId}`)
      const result = await response.json()
      
      if (result.success) {
        setHistory(result.history)
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open, productId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculatePriceChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <History className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Precios
          </DialogTitle>
          <DialogDescription>
            Evolución de precios para: {productName}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay historial de precios disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => {
              const previousEntry = index < history.length - 1 ? history[index + 1] : null
              const priceChange = previousEntry ? calculatePriceChange(entry.price, previousEntry.price) : 0
              
              return (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold">{formatCurrency(entry.price)}</span>
                        {priceChange !== 0 && (
                          <Badge variant={priceChange > 0 ? 'destructive' : 'default'} className="text-xs">
                            {priceChange > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.documentDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Package className="h-3 w-3" />
                          Costo:
                        </div>
                        <p className="font-medium">{formatCurrency(entry.cost)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <FileText className="h-3 w-3" />
                          Documento:
                        </div>
                        <p className="font-medium">{entry.documentNumber}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Building2 className="h-3 w-3" />
                          Proveedor:
                        </div>
                        <p className="font-medium">{entry.supplierName}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Package className="h-3 w-3" />
                          Cantidad:
                        </div>
                        <p className="font-medium">{entry.quantity}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold">{formatCurrency(entry.totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
