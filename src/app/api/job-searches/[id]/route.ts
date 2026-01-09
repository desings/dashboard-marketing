import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobController } from '@/controllers/supabaseJobController'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const controller = new SupabaseJobController()
    const jobSearch = await controller.updateJobSearch(id, body)
    
    return NextResponse.json({
      success: true,
      data: jobSearch
    })
  } catch (error) {
    console.error('❌ Error en PUT job-search:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const controller = new SupabaseJobController()
    await controller.deleteJobSearch(id)
    
    return NextResponse.json({
      success: true,
      message: 'Búsqueda eliminada exitosamente'
    })
  } catch (error) {
    console.error('❌ Error en DELETE job-search:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}