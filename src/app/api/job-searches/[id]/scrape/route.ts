import { NextRequest, NextResponse } from 'next/server'
import { JobController } from '@/controllers/jobController'

// Función para verificar si la DB está disponible
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) return false
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch {
    return false
  }
}

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