import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Inicializando base de datos...')

  try {
    // Verificar si ya existe un usuario administrador
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Usuario administrador ya existe')
      return
    }

    // Crear usuario administrador por defecto
    const adminUser = await AuthService.createUser({
      name: 'Administrador',
      email: 'admin@vervoer.com',
      password: 'admin123',
      role: 'ADMIN'
    })

    if (!adminUser) {
      throw new Error('No se pudo crear el usuario administrador')
    }

    console.log('✅ Usuario administrador creado:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Contraseña: admin123`)
    console.log(`   Rol: ${adminUser.role}`)

    // Crear algunos usuarios de ejemplo
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
      const user = await AuthService.createUser(userData)
      if (user) {
        console.log(`✅ Usuario creado: ${user.email} (${user.role})`)
      } else {
        console.log(`❌ Error creando usuario: ${userData.email}`)
      }
    }

    console.log('\n🎉 Base de datos inicializada correctamente!')
    console.log('\n📋 Credenciales de acceso:')
    console.log('   Admin: admin@vervoer.com / admin123')
    console.log('   Usuario: usuario@vervoer.com / usuario123')
    console.log('   Viewer: viewer@vervoer.com / viewer123')

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
