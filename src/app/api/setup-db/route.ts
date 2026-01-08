import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Solo permitir en desarrollo
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No permitido en producción' }, { status: 403 })
  }

  try {
    console.log('🔄 Iniciando migración/setup de base de datos...')
    
    // Test de conexión
    await prisma.$connect()
    console.log('✅ Conexión a base de datos establecida')

    // Verificar si las tablas existen
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('JobSearch', 'JobOffer', 'CompanyProfile');
    `
    
    console.log('📊 Tablas existentes:', tables)

    // Crear datos de ejemplo si no existen
    const existingSearches = await prisma.jobSearch.count()
    
    if (existingSearches === 0) {
      console.log('🌱 Creando datos de ejemplo...')
      
      await prisma.jobSearch.create({
        data: {
          userId: 'demo-user',
          keywords: 'desarrollador react javascript',
          portals: ['infojobs'],
          frequencyMinutes: 360,
          isActive: true
        }
      })

      await prisma.jobSearch.create({
        data: {
          userId: 'demo-user',
          keywords: 'marketing digital seo',
          portals: ['infojobs'],
          frequencyMinutes: 720,
          isActive: false
        }
      })

      console.log('✅ Datos de ejemplo creados')
    } else {
      console.log('⏭️ Ya existen datos, no se crean ejemplos')
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos configurada correctamente',
      tablesCount: Array.isArray(tables) ? tables.length : 0,
      searchesCount: existingSearches
    })

  } catch (error) {
    console.error('❌ Error en setup de base de datos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}