import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Inicializando base de datos y datos demo...')

    // Test de conexión
    await prisma.$connect()
    console.log('✅ Conexión a base de datos establecida')

    // Crear usuario demo si no existe
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        id: 'demo-user',
        email: 'demo@example.com',
        passwordHash: '$2b$10$dummy.hash.for.demo'
      }
    })

    // Crear tenant demo si no existe
    const demoTenant = await prisma.tenant.upsert({
      where: { id: 'demo-tenant' },
      update: {},
      create: {
        id: 'demo-tenant',
        name: 'Cliente Demo'
      }
    })

    // Crear relación UserTenant si no existe
    await prisma.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId: demoUser.id,
          tenantId: demoTenant.id
        }
      },
      update: {},
      create: {
        userId: demoUser.id,
        tenantId: demoTenant.id,
        role: 'owner'
      }
    })

    console.log('✅ Base de datos inicializada con datos demo')
    
    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada exitosamente',
      data: {
        user: demoUser.id,
        tenant: demoTenant.id
      }
    })

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error con la base de datos. Asegúrate de que DATABASE_URL esté configurado correctamente.'
    }, { status: 500 })
  }
}