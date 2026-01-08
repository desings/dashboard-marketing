import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// Definir el tipo localmente
type JobStatus = 'ACTIVE' | 'DISCARDED' | 'INTERESTED_DAVID' | 'INTERESTED_IVAN'

// POST /api/job-offers/[id]/status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()
    
    // Validar que el status sea válido
    const validStatuses: JobStatus[] = ['ACTIVE', 'DISCARDED', 'INTERESTED_DAVID', 'INTERESTED_IVAN']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Status inválido. Valores permitidos: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      )
    }
    
    const jobOffer = await JobController.updateJobOfferStatus(id, status)
    
    return NextResponse.json({
      success: true,
      data: jobOffer,
      message: `Status actualizado a: ${status}`
    })
  } catch (error) {
    console.error('❌ Error en POST job-offer status:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}