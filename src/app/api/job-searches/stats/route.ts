import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// GET /api/job-searches/stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user'
    
    console.log('GET job-searches/stats - userId:', userId)

    // Intentar usar funcionalidad real primero
    try {
      const stats = await JobController.getJobSearchStats(userId)
      return NextResponse.json({
        success: true,
        data: stats
      })
    } catch (dbError) {
      console.warn('⚠️ Base de datos no disponible para stats, usando datos demo:', dbError)
      
      // Fallback a datos demo
      const mockStats = {
        totalSearches: 3,
        activeSearches: 2,
        totalOffers: 26,
        todayOffers: 5,
        offersByStatus: {
          'PENDING': 15,
          'REVIEWED': 8,
          'APPLIED': 2,
          'REJECTED': 1
        }
      }

      return NextResponse.json({
        success: true,
        data: mockStats,
        message: 'Estadísticas demo - módulo en inicialización'
      })
    }
    
  } catch (error) {
    console.error('❌ Error en GET stats:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}