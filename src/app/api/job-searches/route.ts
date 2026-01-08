import { NextRequest, NextResponse } from 'next/server'

// GET /api/job-searches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('GET job-searches - userId:', userId, 'page:', page, 'limit:', limit)

    // Datos demo para búsquedas de trabajo
    const mockJobSearches = [
      {
        id: '1',
        keywords: 'desarrollador frontend React',
        portals: ['infojobs', 'linkedin'],
        frequencyMinutes: 60,
        isActive: true,
        createdAt: new Date().toISOString(),
        _count: {
          jobOffers: 15
        }
      },
      {
        id: '2', 
        keywords: 'programador javascript nodejs',
        portals: ['infojobs'],
        frequencyMinutes: 120,
        isActive: true,
        createdAt: new Date(Date.now() - 24*60*60*1000).toISOString(),
        _count: {
          jobOffers: 8
        }
      },
      {
        id: '3',
        keywords: 'diseñador UX UI',
        portals: ['linkedin', 'indeed'],
        frequencyMinutes: 240,
        isActive: false,
        createdAt: new Date(Date.now() - 48*60*60*1000).toISOString(),
        _count: {
          jobOffers: 3
        }
      }
    ]

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = mockJobSearches.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: paginatedData,
      total: mockJobSearches.length,
      totalPages: Math.ceil(mockJobSearches.length / limit),
      currentPage: page,
      message: 'Datos de demostración - módulo operativo'
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

    // Simular creación exitosa en modo demo
    const newJobSearch = {
      id: Date.now().toString(),
      keywords: body.keywords,
      portals: body.portals || ['infojobs'],
      frequencyMinutes: body.frequencyMinutes || 60,
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: {
        jobOffers: 0
      }
    }

    return NextResponse.json({
      success: true,
      data: newJobSearch,
      message: 'Búsqueda creada exitosamente (demo)'
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Error en POST job-searches:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}