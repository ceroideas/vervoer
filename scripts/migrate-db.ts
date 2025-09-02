#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando migración de la base de datos...')

  try {
    // Verificar si existe el directorio de migraciones
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations')
    if (!existsSync(migrationsDir)) {
      console.log('📁 Creando directorio de migraciones...')
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit' })
    } else {
      console.log('📁 Aplicando migraciones existentes...')
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    }

    // Generar el cliente de Prisma
    console.log('🔧 Generando cliente de Prisma...')
    execSync('npx prisma generate', { stdio: 'inherit' })

    // Verificar conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...')
    await prisma.$connect()
    console.log('✅ Conexión a la base de datos exitosa')

    // Verificar si las tablas existen
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Document', 'Supplier', 'DocumentItem', 'Product', 'UserSession')
    `

    console.log('📊 Tablas encontradas:', (tables as any[]).map(t => t.table_name))

    if ((tables as any[]).length === 0) {
      console.log('⚠️  No se encontraron tablas. Ejecutando push de esquema...')
      execSync('npx prisma db push', { stdio: 'inherit' })
    }

    console.log('✅ Migración completada exitosamente')

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
