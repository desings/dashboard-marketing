import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const jobSearch = await JobController.updateJobSearch(id, body)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    await JobController.deleteJobSearch(id)
    
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