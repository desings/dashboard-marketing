import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'
import { isDatabaseAvailable } from '@/lib/database'

// GET /api/job-searches/stats
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
    
    console.log('GET job-searches/stats - userId:', userId)

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable()
    
    if (dbAvailable) {
      try {
        const stats = await JobController.getJobSearchStats(userId)
        return NextResponse.json({
          success: true,
          data: stats
        })
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos:', dbError)
      }
    }
    
    // Sin base de datos configurada - devolver estadísticas en cero
    console.log('🔄 DATABASE_URL no configurada - Sistema requiere base de datos PostgreSQL')
    const emptyStats = {
      totalSearches: 0,
      activeSearches: 0,
      totalOffers: 0,
      todayOffers: 0,
      offersByStatus: {
        ACTIVE: 0,
        DISCARDED: 0,
        INTERESTED_DAVID: 0,
        INTERESTED_IVAN: 0
      }
    }

    return NextResponse.json({
      success: true,
      data: emptyStats,
      message: '⚠️ Configura DATABASE_URL para estadísticas reales'
    })
    
  } catch (error) {
    console.error('❌ Error en GET stats:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}