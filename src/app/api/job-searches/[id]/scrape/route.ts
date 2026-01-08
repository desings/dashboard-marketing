import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobController } from '@/controllers/supabaseJobController'
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
        error: 'Supabase no configurado. Configure la base de datos para realizar scraping real de InfoJobs.',
        requiresSetup: true
      }, { status: 400 })
    }
    
    console.log(`🚀 Iniciando scraping REAL de InfoJobs para búsqueda: ${id}`)
    
    const jobController = new SupabaseJobController()
    const result = await jobController.manualScraping(id)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message,
        errors: result.errors
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        newOffersCount: result.newOffersCount,
        totalProcessed: result.totalProcessed,
        errors: result.errors
      },
      message: result.message
    })
    
  } catch (error) {
    console.error('❌ Error en scraping manual REAL:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno durante scraping real',
        message: 'Error ejecutando scraper de InfoJobs'
      },
      { status: 500 }
    )
  }
}