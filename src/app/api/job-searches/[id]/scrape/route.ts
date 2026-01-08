import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'
import { isDatabaseAvailable } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar que la base de datos esté disponible
    const dbAvailable = await isDatabaseAvailable()
    
    if (!dbAvailable) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL no configurada. Configure una base de datos PostgreSQL para realizar scraping real de InfoJobs.',
        requiresSetup: true
      }, { status: 400 })
    }
    
    const result = await JobController.manualScraping(id)
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Scraping completado: ${result.newOffersCount} nuevas ofertas encontradas en InfoJobs`
    })
  } catch (error) {
    console.error('❌ Error en scraping manual:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}