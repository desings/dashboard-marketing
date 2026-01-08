import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// Definir el tipo localmente
type JobStatus = 'ACTIVE' | 'DISCARDED' | 'INTERESTED_DAVID' | 'INTERESTED_IVAN'

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

// GET /api/job-offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const rawUserId = searchParams.get('userId')
    if (!rawUserId) {
      return NextResponse.json(
        { success: false, error: 'userId requerido' },
        { status: 400 }
      )
    }

    const filters = {
      status: searchParams.get('status') as JobStatus || undefined,
      jobSearchId: searchParams.get('jobSearchId') || undefined,
      userId: rawUserId
    }
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Limpiar filtros undefined
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable()
    
    if (dbAvailable) {
      try {
        const result = await JobController.getJobOffers(filters, page, limit)
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
    const mockOffers = [
      {
        id: '1',
        title: 'Desarrollador Frontend React',
        company: 'TechCorp Madrid',
        location: 'Madrid',
        salary: '35.000 - 45.000 €',
        url: 'https://infojobs.net/ejemplo1',
        portal: 'infojobs',
        status: 'ACTIVE',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        scrapedAt: new Date().toISOString(),
        jobSearch: { keywords: 'react developer' }
      },
      {
        id: '2',
        title: 'Programador JavaScript Full Stack',
        company: 'StartupTech Barcelona',
        location: 'Barcelona',
        salary: '40.000 - 50.000 €',
        url: 'https://infojobs.net/ejemplo2',
        portal: 'infojobs',
        status: 'ACTIVE',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        scrapedAt: new Date().toISOString(),
        jobSearch: { keywords: 'javascript fullstack' }
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: mockOffers,
      total: mockOffers.length,
      totalPages: 1,
      message: '⚠️ DATOS TEMPORALES - Configura DATABASE_URL para ofertas reales'
    })
  } catch (error) {
    console.error('❌ Error en GET job-offers:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}