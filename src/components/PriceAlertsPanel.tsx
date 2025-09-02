"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Edit
} from 'lucide-react'
import { toast } from 'sonner'
import { PriceVariation } from '@/types/price-alert'

interface PriceAlertsPanelProps {
  onProductUpdate?: () => void;
}

export function PriceAlertsPanel({ onProductUpdate }: PriceAlertsPanelProps) {
  const [alerts, setAlerts] = useState<PriceVariation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<PriceVariation | null>(null)

  const loadAlerts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/price-alerts')
      const result = await response.json()
      
      if (result.success) {
        setAlerts(result.alerts)
      } else {
        toast.error('Error cargando alertas')
      }
    } catch (error) {
      console.error('Error cargando alertas:', error)
      toast.error('Error cargando alertas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleUpdateProduct = async (alert: PriceVariation) => {
    try {
      const response = await fetch('/api/price-alerts/update-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: alert.productId,
          newData: {
            price: alert.newPrice,
            cost: alert.newPrice * 0.8, // Estimación del costo
            name: alert.productName
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Producto actualizado exitosamente')
        setSelectedAlert(null)
        loadAlerts()
        onProductUpdate?.()
      } else {
        toast.error(result.error || 'Error actualizando producto')
      }
    } catch (error) {
      console.error('Error actualizando producto:', error)
      toast.error('Error actualizando producto')
    }
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'price_increase':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'price_decrease':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'discount_anomaly':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <DollarSign className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    const sign = percentage > 0 ? '+' : ''
    return `${sign}${percentage.toFixed(2)}%`
  }

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'price_increase':
        return 'Aumento de Precio'
      case 'price_decrease':
        return 'Disminución de Precio'
      case 'discount_anomaly':
        return 'Descuento Anómalo'
      default:
        return 'Normal'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítico'
      case 'high':
        return 'Alto'
      case 'medium':
        return 'Medio'
      case 'low':
        return 'Bajo'
      default:
        return 'Normal'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Alertas de Precios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando alertas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas de Precios
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{alerts.length}</Badge>
            <Button size="sm" variant="outline" onClick={loadAlerts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Variaciones de precios detectadas en productos existentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No hay alertas de precios pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.alertType)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{alert.productName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getAlertTypeLabel(alert.alertType)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getSeverityLabel(alert.severity)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Precio Anterior:</p>
                          <p className="font-medium">{formatCurrency(alert.oldPrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Nuevo Precio:</p>
                          <p className="font-medium">{formatCurrency(alert.newPrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Variación:</p>
                          <p className={`font-medium ${
                            alert.variationAmount > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatPercentage(alert.variationPercentage)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Diferencia:</p>
                          <p className={`font-medium ${
                            alert.variationAmount > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(alert.variationAmount)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Documento: {alert.documentNumber}</p>
                        <p>Proveedor: {alert.supplierName}</p>
                        <p>Fecha: {new Date(alert.documentDate).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                      title="Ver detalles de la alerta"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleUpdateProduct(alert)}
                      title="Actualizar producto en Holded"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {selectedAlert?.id === alert.id && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <h5 className="font-medium mb-2">Acciones Recomendadas:</h5>
                    <div className="space-y-2 text-sm">
                      <p>• <strong>Actualizar precio:</strong> Cambiar el precio de {formatCurrency(alert.oldPrice)} a {formatCurrency(alert.newPrice)}</p>
                      <p>• <strong>Revisar proveedor:</strong> {alert.supplierName}</p>
                      <p>• <strong>Verificar documento:</strong> {alert.documentNumber}</p>
                      {alert.notes && (
                        <p>• <strong>Notas:</strong> {alert.notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
