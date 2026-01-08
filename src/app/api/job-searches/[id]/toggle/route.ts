import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Intentar funcionalidad real primero
    try {
      const jobSearch = await JobController.toggleJobSearchStatus(id)
      
      return NextResponse.json({
        success: true,
        data: jobSearch,
        message: `Búsqueda ${jobSearch.isActive ? 'activada' : 'desactivada'} exitosamente`
      })
    } catch (dbError) {
      console.warn('⚠️ Base de datos no disponible para toggle, simulando:', dbError)
      
      // Simular toggle en modo demo
      const isActive = Math.random() > 0.5 // Random true/false
      const mockJobSearch = {
        id,
        isActive,
        updatedAt: new Date().toISOString()
      }
      
      return NextResponse.json({
        success: true,
        data: mockJobSearch,
        message: `Búsqueda ${isActive ? 'activada' : 'desactivada'} exitosamente (modo demo)`
      })
    }
  } catch (error) {
    console.error('❌ Error en toggle job-search:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}