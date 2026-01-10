import { NextRequest, NextResponse } from 'next/server'

// POST - Execute scheduled posts that are due  
export async function POST(req: NextRequest) {
  try {
    // TEMPORAL: Scheduler deshabilitado hasta resolver problemas de EPIPE
    return NextResponse.json({
      success: true,
      message: 'Scheduler temporalmente deshabilitado - sistema en modo demo',
      executed: 0,
      results: []
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error en scheduler'
    }, { status: 500 });
  }
}