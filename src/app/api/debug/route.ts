import { NextRequest, NextResponse } from 'next/server'

// GET /api/debug - Verificar estado de variables de entorno
export async function GET(request: NextRequest) {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_POOLER: !!process.env.DATABASE_URL_POOLER,
    NODE_ENV: process.env.NODE_ENV,
    // Solo mostrar primeros caracteres para seguridad
    SUPABASE_URL_PREVIEW: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    SUPABASE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    // Verificar si no son valores de demo
    IS_DEMO_URL: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co',
    IS_DEMO_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY === 'demo-key'
  }

  return NextResponse.json({
    success: true,
    environment: env,
    timestamp: new Date().toISOString()
  })
}