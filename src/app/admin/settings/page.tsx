"use client"
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { 
  Settings, 
  Save,
  Database,
  Shield,
  Bell,
  Globe
} from 'lucide-react'

interface Settings {
  apiKey: string
  baseUrl: string
  emailNotifications: boolean
  autoProcess: boolean
  language: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    baseUrl: 'https://api.holded.com/api/v1',
    emailNotifications: true,
    autoProcess: false,
    language: 'es'
  })

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
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Ingresa tu API key"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL Base</label>
              <Input
                value={settings.baseUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.holded.com/api/v1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Idioma</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Notificaciones */}
        <Card>
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
        </Card>

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
                <span className="text-sm text-green-600">Funcionando</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Holded</span>
                <span className="text-sm text-muted-foreground">No configurado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Base de Datos</span>
                <span className="text-sm text-green-600">Conectado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notificaciones</span>
                <span className="text-sm text-green-600">Activas</span>
              </div>
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
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Probar Conexión
              </Button>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Verificar Seguridad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
