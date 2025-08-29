import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { User, UserSession } from '@prisma/client'
import { UserWithoutPassword, LoginCredentials, AuthResponse } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export class AuthService {
  // Encriptar contraseña
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  // Verificar contraseña
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // Generar JWT token
  static generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }

  // Verificar JWT token
  static verifyToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch (error) {
      return null
    }
  }

  // Login de usuario
  static async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    const { email, password } = credentials

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user || !user.isActive) {
      return null
    }

    // Verificar contraseña
    const isValidPassword = await this.verifyPassword(password, user.password)
    if (!isValidPassword) {
      return null
    }

    // Generar token
    const token = this.generateToken(user.id)

    // Guardar sesión en base de datos
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      }
    })

    // Retornar usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      token
    }
  }

  // Logout de usuario
  static async logout(token: string): Promise<boolean> {
    try {
      await prisma.userSession.delete({
        where: { token }
      })
      return true
    } catch (error) {
      return false
    }
  }

  // Obtener usuario actual por token
  static async getCurrentUser(token: string): Promise<UserWithoutPassword | null> {
    const payload = this.verifyToken(token)
    if (!payload) {
      return null
    }

    // Verificar que la sesión existe en la base de datos
    const session = await prisma.userSession.findUnique({
      where: { token }
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user || !user.isActive) {
      return null
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Crear usuario
  static async createUser(userData: {
    name: string
    email: string
    password: string
    role?: 'ADMIN' | 'USER' | 'VIEWER'
  }): Promise<UserWithoutPassword> {
    const hashedPassword = await this.hashPassword(userData.password)

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'USER'
      }
    })

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Limpiar sesiones expiradas
  static async cleanExpiredSessions(): Promise<void> {
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }

  // Cambiar contraseña
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return false
    }

    // Verificar contraseña actual
    const isValidPassword = await this.verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      return false
    }

    // Encriptar nueva contraseña
    const hashedNewPassword = await this.hashPassword(newPassword)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    return true
  }
}
