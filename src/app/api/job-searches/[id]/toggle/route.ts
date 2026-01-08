import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const jobSearch = await JobController.toggleJobSearchStatus(id)
    
    return NextResponse.json({
      success: true,
      data: jobSearch,
      message: `Búsqueda ${jobSearch.isActive ? 'activada' : 'desactivada'} exitosamente`
    })
  } catch (error) {
    console.error('❌ Error en toggle job-search:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}