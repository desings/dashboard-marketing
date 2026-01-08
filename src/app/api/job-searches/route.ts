import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobController } from '@/controllers/supabaseJobController'
import { isDatabaseAvailable } from '@/lib/database'

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
        const controller = new SupabaseJobController()
        const result = await controller.getJobSearches(userId, page, limit)
        return NextResponse.json({
          success: true,
          ...result
        })
      } catch (dbError) {
        console.warn('⚠️ Error en Supabase:', dbError)
      }
    }
    
    // Sin base de datos configurada - devolver vacío (Última actualización: 8 enero 2026)
    console.log('🔄 DATABASE_URL no configurada - Sistema requiere base de datos PostgreSQL')
    
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      totalPages: 0,
      message: '⚠️ Configura DATABASE_URL para crear búsquedas reales de InfoJobs'
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
        const controller = new SupabaseJobController()
        const jobSearch = await controller.createJobSearch(body)
        
        return NextResponse.json({
          success: true,
          data: jobSearch,
          message: 'Búsqueda creada exitosamente en Supabase - scraping iniciado'
        }, { status: 201 })
      } catch (dbError) {
        console.error('❌ Error creando búsqueda en Supabase:', dbError)
        return NextResponse.json(
          { success: false, error: 'Error creando búsqueda en Supabase' },
          { status: 500 }
        )
      }
    }
    
    // Sin base de datos configurada - no permitir crear búsquedas
    console.log('🚫 DATABASE_URL no configurada - No se pueden crear búsquedas')
    return NextResponse.json({
      success: false,
      error: 'DATABASE_URL no configurada. Configure una base de datos PostgreSQL para crear búsquedas reales de InfoJobs.',
      requiresSetup: true
    }, { status: 400 })
  } catch (error) {
    console.error('❌ Error en POST job-searches:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}