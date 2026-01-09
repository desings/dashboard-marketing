import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobController } from '@/controllers/supabaseJobController'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const controller = new SupabaseJobController()
    const jobSearch = await controller.toggleJobSearchStatus(id)
    
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