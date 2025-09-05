"use client"
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { 
  Save,
  Eye,
  EyeOff
} from 'lucide-react'

interface Settings {
  holdedApiKey: string
  holdedBaseUrl: string
  openaiApiKey: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    holdedApiKey: '',
    holdedBaseUrl: 'https://api.holded.com/api/v1',
    openaiApiKey: ''
  })
  const [showHoldedKey, setShowHoldedKey] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)

  // Cargar configuración desde el .env al montar el componente
  useEffect(() => {
    loadEnvConfig()
  }, [])

  const loadEnvConfig = async () => {
    try {
      console.log('🔄 Cargando configuración del sistema...')
      const response = await fetch('/api/system-config')
      const result = await response.json()
      
      console.log('📥 Respuesta de la API:', result)
      
      if (result.success) {
        const newSettings = {
          holdedApiKey: result.data.holdedApiKey || '',
          holdedBaseUrl: result.data.holdedBaseUrl || 'https://api.holded.com/api/v1',
          openaiApiKey: result.data.openaiApiKey || ''
        }
        
        console.log('⚙️ Configuración cargada:', {
          holdedApiKey: newSettings.holdedApiKey ? '***' + newSettings.holdedApiKey.slice(-4) : 'Vacía',
          holdedBaseUrl: newSettings.holdedBaseUrl,
          openaiApiKey: newSettings.openaiApiKey ? '***' + newSettings.openaiApiKey.slice(-4) : 'Vacía'
        })
        
        setSettings(newSettings)
      } else {
        console.error('❌ Error en la respuesta:', result.error)
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error)
    }
  }

  const handleSave = () => {
    // Aquí se guardarían las configuraciones
    console.log('Guardando configuraciones:', settings)
  }

  return (
    <AdminLayout title="Configuración del Sistema">
      <div className="grid gap-6">
        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>
              Configuración básica del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">API Key de Holded</label>
              <div className="flex gap-2">
                <Input
                  type={showHoldedKey ? "text" : "password"}
                  value={settings.holdedApiKey}
                  readOnly
                  className="bg-gray-50"
                  placeholder="API key de Holded desde .env.local"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHoldedKey(!showHoldedKey)}
                  className="px-3"
                >
                  {showHoldedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configurada desde el archivo .env.local
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">URL Base de Holded</label>
              <Input
                value={settings.holdedBaseUrl}
                readOnly
                className="bg-gray-50"
                placeholder="https://api.holded.com/api/v1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL fija de la API de Holded
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">API Key de OpenAI (GPT-4o mini)</label>
              <div className="flex gap-2">
                <Input
                  type={showOpenaiKey ? "text" : "password"}
                  value={settings.openaiApiKey}
                  readOnly
                  className="bg-gray-50"
                  placeholder="API key de OpenAI desde .env.local"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="px-3"
                >
                  {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configurada desde el archivo .env.local
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Idioma</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                Español
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Notificaciones - OCULTO */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>
              Configura las notificaciones del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Notificaciones por Email</label>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones por email cuando se procesen documentos
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Procesamiento Automático</label>
                <p className="text-sm text-muted-foreground">
                  Procesa documentos automáticamente sin revisión manual
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoProcess}
                onChange={(e) => setSettings(prev => ({ ...prev, autoProcess: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </CardContent>
        </Card> */}

        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Información sobre el estado actual del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sistema OCR</span>
                <span className="text-sm text-green-600">GPT-4o mini Activo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Holded</span>
                <span className="text-sm text-green-600">Conectado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Base de Datos</span>
                <span className="text-sm text-green-600">Conectado</span>
              </div>
              {/* <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notificaciones</span>
                <span className="text-sm text-green-600">Activas</span>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>
              Acciones disponibles para la configuración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleSave} disabled>
                <Save className="h-4 w-4 mr-2" />
                Configuración desde .env.local
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Las API keys se configuran directamente en el archivo .env.local del servidor
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
