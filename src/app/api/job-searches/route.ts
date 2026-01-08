import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// Función para verificar si la DB está disponible
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) return false
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch {
    return false
  }
}

// GET /api/job-searches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId requerido' },
        { status: 400 }
      )
    }
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('GET job-searches - userId:', userId, 'page:', page, 'limit:', limit)

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable()
    
    if (dbAvailable) {
      try {
        const result = await JobController.getJobSearches(userId, page, limit)
        return NextResponse.json({
          success: true,
          ...result
        })
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos, usando datos temporales:', dbError)
      }
    }
    
    // Sistema temporal hasta configurar DATABASE_URL
    console.log('🔄 Base de datos no disponible - Usando datos temporales')
    const mockJobSearches = [
      {
        id: '1',
        keywords: 'desarrollador frontend',
        portals: ['infojobs'],
        frequencyMinutes: 240,
        isActive: true,
        userId,
        createdAt: new Date().toISOString(),
        _count: { jobOffers: 5 }
      },
      {
        id: '2', 
        keywords: 'programador javascript',
        portals: ['infojobs'],
        frequencyMinutes: 480,
        isActive: false,
        userId,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        _count: { jobOffers: 12 }
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: mockJobSearches,
      total: mockJobSearches.length,
      totalPages: 1,
      message: '⚠️ DATOS TEMPORALES - Configura DATABASE_URL para funcionalidad real'
    })
    
  } catch (error) {
    console.error('❌ Error en GET job-searches:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// POST /api/job-searches
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST job-searches - body:', body)
    
    if (!body.keywords) {
      return NextResponse.json(
        { success: false, error: 'El campo keywords es requerido' },
        { status: 400 }
      )
    }

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId requerido' },
        { status: 400 }
      )
    }

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable()
    
    if (dbAvailable) {
      try {
        const jobSearch = await JobController.createJobSearch(body)
        
        return NextResponse.json({
          success: true,
          data: jobSearch,
          message: 'Búsqueda creada exitosamente - scraping iniciado'
        }, { status: 201 })
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos, simulando creación:', dbError)
      }
    }
    
    // Sistema temporal hasta configurar DATABASE_URL
    console.log('🔄 Base de datos no disponible - Simulando creación')
    const newJobSearch = {
      id: Date.now().toString(),
      keywords: body.keywords,
      portals: body.portals || ['infojobs'],
      frequencyMinutes: body.frequencyMinutes || 60,
      isActive: true,
      userId: body.userId,
      createdAt: new Date().toISOString(),
      _count: { jobOffers: 0 }
    }

    return NextResponse.json({
      success: true,
      data: newJobSearch,
      message: '⚠️ SIMULADO - Configura DATABASE_URL para crear búsquedas reales'
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Error en POST job-searches:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}