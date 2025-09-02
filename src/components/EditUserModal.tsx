"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
  user: {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'USER' | 'VIEWER'
    status: 'active' | 'inactive'
  } | null
}

interface UserFormData {
  name: string
  email: string
  role: 'ADMIN' | 'USER' | 'VIEWER'
  isActive: boolean
}

export function EditUserModal({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'USER',
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<UserFormData>>({})

  // Actualizar formulario cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.status === 'active'
      })
      setErrors({})
    }
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          isActive: formData.isActive
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al actualizar el usuario')
      }

      toast.success('Usuario actualizado exitosamente')
      onUserUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica la información del usuario seleccionado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ingresa el nombre completo"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="usuario@ejemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'ADMIN' | 'USER' | 'VIEWER') => 
                handleInputChange('role', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuario</SelectItem>
                <SelectItem value="VIEWER">Visualizador</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Estado del usuario</Label>
            <Select
              value={formData.isActive ? 'active' : 'inactive'}
              onValueChange={(value) => handleInputChange('isActive', value === 'active')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Usuario'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
