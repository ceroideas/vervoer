"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserDeleted: () => void
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export function DeleteUserModal({ isOpen, onClose, onUserDeleted, user }: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al eliminar el usuario')
      }

      toast.success('Usuario eliminado exitosamente')
      onUserDeleted()
      onClose()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Eliminar Usuario
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el usuario del sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">
                ¿Estás seguro de que quieres eliminar a <span className="font-bold">{user.name}</span>?
              </p>
              <p className="text-sm text-red-600 mt-1">
                Email: {user.email} | Rol: {user.role}
              </p>
            </div>
          </div>
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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar Usuario'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
