import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// GET /api/job-searches/stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user' // Temporal
    
    const stats = await JobController.getJobSearchStats(userId)
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('❌ Error en GET stats:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}