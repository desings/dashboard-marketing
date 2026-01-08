import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// Definir el tipo localmente
type JobStatus = 'ACTIVE' | 'DISCARDED' | 'INTERESTED_DAVID' | 'INTERESTED_IVAN'

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

    const result = await JobController.getJobOffers(filters, page, limit)
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('❌ Error en GET job-offers:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}