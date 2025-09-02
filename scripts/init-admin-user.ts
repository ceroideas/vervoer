import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Verificando si existe un usuario administrador...')
    
    // Verificar si ya existe un usuario administrador
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Ya existe un usuario administrador:', existingAdmin.email)
      return
    }

    console.log('📝 Creando usuario administrador por defecto...')
    
    // Crear usuario administrador por defecto
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@vervoer.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ Usuario administrador creado exitosamente:')
    console.log('   Email: admin@vervoer.com')
    console.log('   Contraseña: admin123')
    console.log('   ID:', adminUser.id)
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
