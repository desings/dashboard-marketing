import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// GET /api/job-searches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('GET job-searches - userId:', userId, 'page:', page, 'limit:', limit)

    const result = await JobController.getJobSearches(userId, page, limit)
    return NextResponse.json({
      success: true,
      ...result
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
    
    // Validar campos requeridos
    if (!body.keywords) {
      return NextResponse.json(
        { success: false, error: 'El campo keywords es requerido' },
        { status: 400 }
      )
    }

    const data = {
      ...body,
      userId: body.userId || 'demo-user'
    }

    const jobSearch = await JobController.createJobSearch(data)
    
    return NextResponse.json({
      success: true,
      data: jobSearch,
      message: 'Búsqueda creada exitosamente'
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Error en POST job-searches:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}