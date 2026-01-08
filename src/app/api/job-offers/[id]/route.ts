import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// GET /api/job-offers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const jobOffer = await JobController.getJobOfferById(id)
    
    return NextResponse.json({
      success: true,
      data: jobOffer
    })
  } catch (error) {
    console.error('❌ Error en GET job-offer:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// DELETE /api/job-offers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await JobController.deleteJobOffer(id)
    
    return NextResponse.json({
      success: true,
      message: 'Oferta eliminada exitosamente'
    })
  } catch (error) {
    console.error('❌ Error en DELETE job-offer:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}