import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// GET /api/debug-models - Endpoint temporal para verificar modelos disponibles
export async function GET(request: NextRequest) {
  try {
    const prisma = new PrismaClient()
    
    // Verificar qué modelos están disponibles
    const models = Object.keys(prisma).filter(key => 
      key !== '_dmmf' && 
      key !== '_engine' && 
      key !== '_fetcher' && 
      key !== '_queryType' && 
      key !== '_clientVersion' && 
      !key.startsWith('$')
    )
    
    return NextResponse.json({
      success: true,
      availableModels: models,
      message: 'Modelos disponibles en Prisma client'
    })
  } catch (error) {
    console.error('❌ Error verificando modelos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error verificando modelos Prisma'
    }, { status: 500 })
  }
}