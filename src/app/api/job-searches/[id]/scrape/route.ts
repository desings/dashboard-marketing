import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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