#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/lib/auth'
import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Configurando servidor Vervoer...')

  try {
    // 1. Verificar variables de entorno
    console.log('🔍 Verificando variables de entorno...')
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'HOLDED_API_KEY',
      'OPENAI_API_KEY'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    if (missingVars.length > 0) {
      console.error('❌ Variables de entorno faltantes:', missingVars)
      console.log('📝 Asegúrate de que el archivo .env esté configurado correctamente')
      process.exit(1)
    }

    console.log('✅ Variables de entorno verificadas')

    // 2. Generar cliente de Prisma
    console.log('🔧 Generando cliente de Prisma...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Cliente de Prisma generado')

    // 3. Verificar conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...')
    await prisma.$connect()
    console.log('✅ Conexión a la base de datos exitosa')

    // 4. Aplicar migraciones
    console.log('📁 Aplicando migraciones...')
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      console.log('✅ Migraciones aplicadas')
    } catch (error) {
      console.log('⚠️  No hay migraciones, ejecutando push de esquema...')
      execSync('npx prisma db push', { stdio: 'inherit' })
      console.log('✅ Esquema aplicado')
    }

    // 5. Verificar tablas
    console.log('📊 Verificando tablas...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Document', 'Supplier', 'DocumentItem', 'Product', 'UserSession')
    `

    console.log('📋 Tablas encontradas:', (tables as any[]).map(t => t.table_name))

    // 6. Inicializar usuarios si no existen
    console.log('👥 Verificando usuarios...')
    const existingUsers = await prisma.user.count()
    
    if (existingUsers === 0) {
      console.log('👤 Creando usuarios por defecto...')
      
      // Crear usuario administrador
      const adminUser = await AuthService.createUser({
        name: 'Administrador',
        email: 'admin@vervoer.com',
        password: 'admin123',
        role: 'ADMIN'
      })

      // Crear usuarios de ejemplo
      const users = [
        {
          name: 'Usuario Ejemplo',
          email: 'usuario@vervoer.com',
          password: 'usuario123',
          role: 'USER' as const
        },
        {
          name: 'Visualizador',
          email: 'viewer@vervoer.com',
          password: 'viewer123',
          role: 'VIEWER' as const
        }
      ]

      for (const userData of users) {
        await AuthService.createUser(userData)
      }

      console.log('✅ Usuarios creados')
      console.log('\n📋 Credenciales de acceso:')
      console.log('   Admin: admin@vervoer.com / admin123')
      console.log('   Usuario: usuario@vervoer.com / usuario123')
      console.log('   Viewer: viewer@vervoer.com / viewer123')
    } else {
      console.log('✅ Usuarios ya existen')
    }

    // 7. Crear archivo de estado
    const statusFile = join(process.cwd(), '.server-status')
    writeFileSync(statusFile, JSON.stringify({
      setupCompleted: true,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    }, null, 2))

    console.log('\n🎉 Configuración del servidor completada!')
    console.log('\n📋 Resumen:')
    console.log('   ✅ Variables de entorno verificadas')
    console.log('   ✅ Base de datos configurada')
    console.log('   ✅ Migraciones aplicadas')
    console.log('   ✅ Usuarios inicializados')
    console.log('   ✅ Cliente de Prisma generado')

    console.log('\n🚀 La aplicación está lista para ejecutarse')
    console.log('   - Desarrollo: npm run dev')
    console.log('   - Producción: npm start')

  } catch (error) {
    console.error('❌ Error durante la configuración:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
