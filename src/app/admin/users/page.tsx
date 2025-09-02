"use client"
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { CreateUserModal } from '@/components/CreateUserModal'
import { EditUserModal } from '@/components/EditUserModal'
import { DeleteUserModal } from '@/components/DeleteUserModal'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER' | 'VIEWER'
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  documentCount: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  
  // Estados de los modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar los usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleText = (role: User['role']) => {
    const roleMap = {
      'ADMIN': 'Administrador',
      'USER': 'Usuario',
      'VIEWER': 'Visualizador'
    }
    return roleMap[role]
  }

  const getStatusText = (status: User['status']) => {
    return status === 'active' ? 'Activo' : 'Inactivo'
  }

  const getRoleBadgeColor = (role: User['role']) => {
    const colorMap = {
      'ADMIN': 'bg-red-100 text-red-800 border-red-200',
      'USER': 'bg-blue-100 text-blue-800 border-blue-200',
      'VIEWER': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colorMap[role]
  }

  const getStatusBadgeColor = (status: User['status']) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleUserCreated = () => {
    fetchUsers()
  }

  const handleUserUpdated = () => {
    fetchUsers()
  }

  const handleUserDeleted = () => {
    fetchUsers()
  }

  if (isLoading) {
    return (
      <AdminLayout title="Gestión de Usuarios">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Gestión de Usuarios">
      <div className="grid gap-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'ADMIN').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos Procesados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.reduce((total, user) => total + user.documentCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>
              Gestiona los usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los roles</option>
                <option value="ADMIN">Administradores</option>
                <option value="USER">Usuarios</option>
                <option value="VIEWER">Visualizadores</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios del Sistema</CardTitle>
            <CardDescription>
              Lista de todos los usuarios registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron usuarios</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getRoleBadgeColor(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadgeColor(user.status)}`}>
                            {getStatusText(user.status)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                          {user.documentCount > 0 && ` • ${user.documentCount} documento${user.documentCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modales */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onUserDeleted={handleUserDeleted}
        user={selectedUser}
      />
    </AdminLayout>
  )
}
