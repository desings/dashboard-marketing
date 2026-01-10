import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobController } from '@/controllers/supabaseJobController'
import { isDatabaseAvailable } from '@/lib/database'

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
      search: searchParams.get('search') || undefined,
      userId: rawUserId
    }
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Máximo 50, default 10

    console.log(`📊 API Job Offers - Página: ${page}, Límite: ${limit}, Búsqueda: ${filters.search || 'N/A'}`)

    // Limpiar filtros undefined
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable()
    console.log('🔧 Database availability check result:', dbAvailable)
    
    if (dbAvailable) {
      console.log('✅ Database available - proceeding with Supabase')
      try {
        console.log('🔧 Creating SupabaseJobController...')
        const controller = new SupabaseJobController()
        console.log('🔧 Calling getJobOffers with:', { rawUserId, filters, page, limit })
        const result = await controller.getJobOffers(rawUserId, { ...filters, page, limit })
        console.log('✅ Result from Supabase controller:', result)
        return NextResponse.json({
          success: true,
          ...result
        })
      } catch (dbError) {
        console.error('❌ Error obteniendo ofertas de Supabase:', dbError)
        // No hacer fallback, mostrar el error real
        return NextResponse.json({
          success: false,
          error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
        }, { status: 500 })
      }
    } else {
      console.log('❌ Database not available - falling back to empty response')
    }
    
    // Sin base de datos configurada - devolver vacío
    console.log('🔄 DATABASE_URL no configurada - Sistema requiere base de datos PostgreSQL')
    
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      totalPages: 0,
      message: '⚠️ Configura DATABASE_URL para ver ofertas reales de InfoJobs'
    })
  } catch (error) {
    console.error('❌ Error en GET job-offers:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}