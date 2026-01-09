import { NextResponse } from 'next/server'
import { isDatabaseAvailable, getSupabaseClient } from '@/lib/database'

export async function GET() {
  try {
    console.log('🔍 Debug: Verificando configuración Supabase...')
    
    // Forzar valores correctos para debug
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgmltuyfabxomkplvzij.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbWx0dXlmYWJ4b21rcGx2emlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTEyOTc0MywiZXhwIjoyMDUwNzA1NzQzfQ.L0hO5CL2KUnOxLFSmRrnGv0DjKCd6lE4zAqAq2KH9oA'
    
    console.log('📍 URL:', supabaseUrl)
    console.log('📍 Key length:', supabaseKey.length)
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test directo
    const { data, error } = await supabase
      .from('job_searches')
      .select('count', { count: 'exact', head: true })
        
    return NextResponse.json({
      success: !error,
      debug: {
        supabaseUrl,
        supabaseKeyLength: supabaseKey.length,
        testQuery: { 
          data, 
          error: error?.message || null,
          details: error?.details || null,
          hint: error?.hint || null 
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Error en debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}