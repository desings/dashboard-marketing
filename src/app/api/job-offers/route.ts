import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// Definir el tipo localmente
type JobStatus = 'ACTIVE' | 'DISCARDED' | 'INTERESTED_DAVID' | 'INTERESTED_IVAN'

// GET /api/job-offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      status: searchParams.get('status') as JobStatus || undefined,
      jobSearchId: searchParams.get('jobSearchId') || undefined,
      userId: searchParams.get('userId') || 'demo-user' // Temporal
    }
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Limpiar filtros undefined
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    try {
      const result = await JobController.getJobOffers(filters, page, limit)
      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (modelError) {
      // Si hay error con los modelos, devolver datos mock
      console.warn('⚠️ Modelos no disponibles para ofertas, devolviendo mock:', modelError)
      
      const mockOffers = [
        {
          id: '1',
          title: 'Desarrollador Frontend React',
          company: 'TechCorp',
          location: 'Madrid',
          salary: '35.000 - 45.000 €',
          url: 'https://infojobs.net/ejemplo1',
          portal: 'infojobs',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Programador JavaScript Full Stack',
          company: 'StartupTech',
          location: 'Barcelona',
          salary: '40.000 - 50.000 €',
          url: 'https://infojobs.net/ejemplo2',
          portal: 'infojobs',
          status: 'REVIEWED',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      
      return NextResponse.json({
        success: true,
        data: mockOffers,
        total: mockOffers.length,
        totalPages: 1,
        message: 'Ofertas demo - configura DATABASE_URL para datos reales'
      })
    }
  } catch (error) {
    console.error('❌ Error en GET job-offers:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}