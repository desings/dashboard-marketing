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

// GET /api/job-searches/stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId requerido' },
        { status: 400 }
      )
    }
    
    console.log('GET job-searches/stats - userId:', userId)

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable()
    
    if (dbAvailable) {
      try {
        const stats = await JobController.getJobSearchStats(userId)
        return NextResponse.json({
          success: true,
          data: stats
        })
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos, usando stats temporales:', dbError)
      }
    }
    
    // Sistema temporal hasta configurar DATABASE_URL
    console.log('🔄 Base de datos no disponible - Usando stats temporales')
    const mockStats = {
      totalSearches: 2,
      activeSearches: 1,
      totalOffers: 17,
      todayOffers: 3,
      offersByStatus: {
        ACTIVE: 12,
        DISCARDED: 3,
        INTERESTED_DAVID: 2,
        INTERESTED_IVAN: 0
      }
    }

    return NextResponse.json({
      success: true,
      data: mockStats,
      message: '⚠️ DATOS TEMPORALES - Configura DATABASE_URL para estadísticas reales'
    })
    
  } catch (error) {
    console.error('❌ Error en GET stats:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}