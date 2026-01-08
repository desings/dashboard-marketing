import { NextRequest, NextResponse } from 'next/server'

// GET /api/job-searches/stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user'
    
    console.log('GET job-searches/stats - userId:', userId)

    // Datos demo para estadísticas
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
      message: 'Estadísticas de demostración'
    })
    
  } catch (error) {
    console.error('❌ Error en GET stats:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}