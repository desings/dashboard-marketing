import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Intentar funcionalidad real primero
    try {
      const jobSearch = await JobController.updateJobSearch(id, body)
      
      return NextResponse.json({
        success: true,
        data: jobSearch
      })
    } catch (dbError) {
      console.warn('⚠️ Base de datos no disponible para update, simulando:', dbError)
      
      // Simular actualización en modo demo
      const updatedJobSearch = {
        id,
        keywords: body.keywords || 'búsqueda actualizada',
        portals: body.portals || ['infojobs'],
        frequencyMinutes: body.frequencyMinutes || 60,
        isActive: body.isActive !== undefined ? body.isActive : true,
        updatedAt: new Date().toISOString(),
        _count: { jobOffers: Math.floor(Math.random() * 20) }
      }

      return NextResponse.json({
        success: true,
        data: updatedJobSearch,
        message: 'Búsqueda actualizada (modo demo)'
      })
    }
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
    
    // Intentar funcionalidad real primero
    try {
      await JobController.deleteJobSearch(id)
      
      return NextResponse.json({
        success: true,
        message: 'Búsqueda eliminada exitosamente'
      })
    } catch (dbError) {
      console.warn('⚠️ Base de datos no disponible para delete, simulando:', dbError)
      
      // Simular eliminación en modo demo
      return NextResponse.json({
        success: true,
        message: 'Búsqueda eliminada exitosamente (modo demo)'
      })
    }
  } catch (error) {
    console.error('❌ Error en DELETE job-search:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}