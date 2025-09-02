"use client"
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  FileText, 
  Users, 
  Settings, 
  Upload,
  TrendingUp,
  Package,
  Plus,
  Eye,
  Cog
} from 'lucide-react'

interface DashboardStats {
  totalDocuments: number
  totalUsers: number
  totalProducts: number
  recentDocuments: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalUsers: 0,
    totalProducts: 0,
    recentDocuments: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Cargar estadísticas del dashboard
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      
      // Cargar estadísticas de usuarios
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const users = await usersResponse.json()
        setStats(prev => ({ ...prev, totalUsers: users.length }))
      }

      // Aquí podrías cargar más estadísticas cuando implementes las otras APIs
      // Por ahora usamos valores por defecto
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  // Funciones para las acciones rápidas
  const handleUploadDocument = () => {
    // Navegar a la página de documentos o abrir modal de subida
    router.push('/admin/documents')
  }

  const handleViewDocuments = () => {
    router.push('/admin/documents')
  }

  const handleManageUsers = () => {
    router.push('/admin/users')
  }

  const handleSettings = () => {
    router.push('/admin/settings')
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-6">
        {/* Información del usuario */}
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido, {user?.name || 'Administrador'}</CardTitle>
            <CardDescription>
              Panel de control del sistema Vervoer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Desde aquí puedes gestionar documentos, usuarios y configuraciones del sistema.
            </p>
          </CardContent>
        </Card>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Documentos Procesados
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats.totalDocuments}
              </div>
              <p className="text-xs text-muted-foreground">
                Total en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Activos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? '...' : stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUsers === 1 ? 'Solo administrador' : 'Usuarios registrados'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Productos en Stock
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : stats.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalProducts === 0 ? 'Sin productos registrados' : 'Productos disponibles'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Documentos Recientes
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {isLoading ? '...' : stats.recentDocuments}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 7 días
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Funciones principales del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
                onClick={handleUploadDocument}
              >
                <Upload className="h-6 w-6 mb-2 text-blue-600" />
                <span className="text-sm font-medium">Subir Documento</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-300 transition-colors"
                onClick={handleViewDocuments}
              >
                <Eye className="h-6 w-6 mb-2 text-green-600" />
                <span className="text-sm font-medium">Ver Documentos</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-300 transition-colors"
                onClick={handleManageUsers}
              >
                <Users className="h-6 w-6 mb-2 text-purple-600" />
                <span className="text-sm font-medium">Gestionar Usuarios</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center hover:bg-orange-50 hover:border-orange-300 transition-colors"
                onClick={handleSettings}
              >
                <Cog className="h-6 w-6 mb-2 text-orange-600" />
                <span className="text-sm font-medium">Configuración</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acciones adicionales */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Adicionales</CardTitle>
            <CardDescription>
              Otras funciones disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                onClick={() => router.push('/admin/holded')}
              >
                <Package className="h-5 w-5 mb-2 text-indigo-600" />
                <span className="text-sm font-medium">Integración Holded</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center hover:bg-teal-50 hover:border-teal-300 transition-colors"
                onClick={() => router.push('/admin/price-alerts')}
              >
                <TrendingUp className="h-5 w-5 mb-2 text-teal-600" />
                <span className="text-sm font-medium">Alertas de Precios</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center hover:bg-amber-50 hover:border-amber-300 transition-colors"
                onClick={() => router.push('/admin/analytics')}
              >
                <FileText className="h-5 w-5 mb-2 text-amber-600" />
                <span className="text-sm font-medium">Análisis</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado del sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Información sobre el estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sistema OCR</span>
                <span className="text-sm text-muted-foreground">No configurado</span>
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
                <span className="text-sm font-medium">Usuarios Activos</span>
                <span className="text-sm text-blue-600">{stats.totalUsers} usuarios</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
} 