import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// GET /api/job-searches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user' // Temporal
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Verificar si los modelos están disponibles
    try {
      const result = await JobController.getJobSearches(userId, page, limit)
      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (modelError) {
      // Si hay error con los modelos, devolver datos mock temporalmente
      console.warn('⚠️ Modelos no disponibles, devolviendo datos mock:', modelError)
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        totalPages: 0,
        message: 'Módulo en inicialización - datos temporales'
      })
    }
    
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
    
    // Validar campos requeridos
    if (!body.keywords) {
      return NextResponse.json(
        { success: false, error: 'El campo keywords es requerido' },
        { status: 400 }
      )
    }

    const data = {
      ...body,
      userId: body.userId || 'demo-user' // Temporal
    }

    const jobSearch = await JobController.createJobSearch(data)
    
    return NextResponse.json({
      success: true,
      data: jobSearch
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Error en POST job-searches:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}