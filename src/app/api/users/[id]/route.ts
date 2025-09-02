import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// PUT /api/users/[id] - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    // Verificar que sea admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { name, email, role, isActive } = body

    // Validaciones
    if (!name || !email || role === undefined || isActive === undefined) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'USER', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { message: 'Rol inválido' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe en otro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        id: { not: id }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'El email ya está registrado por otro usuario' },
        { status: 400 }
      )
    }

    // Verificar que no se desactive el último admin
    if (!isActive && role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          isActive: true,
          id: { not: id }
        }
      })

      if (adminCount === 0) {
        return NextResponse.json(
          { message: 'No se puede desactivar el último administrador' },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role as 'ADMIN' | 'USER' | 'VIEWER',
        isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        ...updatedUser,
        status: updatedUser.isActive ? 'active' : 'inactive'
      }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    // Verificar que sea admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = params

    // Verificar que no se elimine a sí mismo
    if (id === currentUser.id) {
      return NextResponse.json(
        { message: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Verificar que no se elimine el último admin
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (userToDelete.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          isActive: true
        }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { message: 'No se puede eliminar el último administrador' },
          { status: 400 }
        )
      }
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
