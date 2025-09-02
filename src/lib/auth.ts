import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { User, UserSession } from '@prisma/client'
import { UserWithoutPassword, LoginCredentials, AuthResponse } from '@/types/database'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

// Configuración de NextAuth
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          })

          if (!user || !user.isActive) {
            return null
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}

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

    // Retornar usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Crear nuevo usuario
  static async createUser(userData: {
    name: string
    email: string
    password: string
    role: 'ADMIN' | 'USER' | 'VIEWER'
  }): Promise<UserWithoutPassword | null> {
    try {
      // Verificar si el email ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() }
      })

      if (existingUser) {
        return null
      }

      // Encriptar contraseña
      const hashedPassword = await this.hashPassword(userData.password)

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          role: userData.role,
          isActive: true
        }
      })

      // Retornar usuario sin contraseña
      const { password: _, ...userWithoutPassword } = newUser
      return userWithoutPassword
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }

  // Actualizar usuario
  static async updateUser(userId: string, userData: {
    name?: string
    email?: string
    role?: 'ADMIN' | 'USER' | 'VIEWER'
    isActive?: boolean
  }): Promise<UserWithoutPassword | null> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userData
      })

      // Retornar usuario sin contraseña
      const { password: _, ...userWithoutPassword } = updatedUser
      return userWithoutPassword
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  // Eliminar usuario
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id: userId }
      })
      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }
}
