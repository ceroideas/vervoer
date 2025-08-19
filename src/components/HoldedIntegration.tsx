"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Upload,
  AlertTriangle,
  Info
} from 'lucide-react'

interface HoldedIntegrationProps {
  extractedData?: any;
  onSyncComplete?: (result: any) => void;
}

interface HoldedStatus {
  isConnected: boolean;
  contacts: number;
  invoices: number;
  products: number;
  lastTest?: string;
}

export function HoldedIntegration({ extractedData, onSyncComplete }: HoldedIntegrationProps) {
  const [status, setStatus] = useState<HoldedStatus>({
    isConnected: false,
    contacts: 0,
    invoices: 0,
    products: 0,
  })
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setIsTesting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/holded/test')
      const result = await response.json()
      
      if (result.success) {
        setStatus({
          isConnected: true,
          contacts: result.data.contacts,
          invoices: result.data.invoices,
          products: result.data.products,
          lastTest: new Date().toLocaleString('es-ES'),
        })
      } else {
        setStatus({
          isConnected: false,
          contacts: 0,
          invoices: 0,
          products: 0,
          lastTest: new Date().toLocaleString('es-ES'),
        })
        setError(result.error || 'Error desconocido')
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        contacts: 0,
        invoices: 0,
        products: 0,
        lastTest: new Date().toLocaleString('es-ES'),
      })
      setError('Error de conexión')
    } finally {
      setIsTesting(false)
    }
  }

  const syncWithHolded = async () => {
    if (!extractedData) {
      setError('No hay datos extraídos para sincronizar')
      return
    }

    setIsSyncing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/holded/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extractedData }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setLastSync(result.data)
        onSyncComplete?.(result.data)
      } else {
        setError(result.error || 'Error sincronizando con Holded')
      }
    } catch (error) {
      setError('Error de conexión al sincronizar')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Integración con Holded
          </CardTitle>
          <CardDescription>
            Sincroniza los datos extraídos con tu cuenta de Holded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de conexión */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Estado de conexión:</span>
              <Badge variant={status.isConnected ? 'default' : 'destructive'}>
                {status.isConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Conectado
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Desconectado
                  </>
                )}
              </Badge>
            </div>
            <Button
              onClick={testConnection}
              disabled={isTesting}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Probando...' : 'Probar Conexión'}
            </Button>
          </div>

          {/* Estadísticas */}
          {status.isConnected && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.contacts}</div>
                <div className="text-sm text-gray-600">Contactos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.invoices}</div>
                <div className="text-sm text-gray-600">Facturas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{status.products}</div>
                <div className="text-sm text-gray-600">Productos</div>
              </div>
            </div>
          )}

          {/* Última prueba */}
          {status.lastTest && (
            <div className="text-sm text-gray-500">
              Última prueba: {status.lastTest}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Botón de sincronización */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {extractedData 
                  ? 'Datos listos para sincronizar' 
                  : 'Sube un documento para sincronizar'
                }
              </span>
            </div>
            <Button
              onClick={syncWithHolded}
              disabled={!status.isConnected || !extractedData || isSyncing}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar con Holded'}
            </Button>
          </div>

          {/* Resultado de sincronización */}
          {lastSync && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-700">Sincronización exitosa</span>
              </div>
              <div className="text-sm text-green-600 space-y-1">
                <div>Proveedor: {lastSync.supplier.name}</div>
                <div>Factura: {lastSync.invoice.number}</div>
                <div>Total: {lastSync.invoice.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
