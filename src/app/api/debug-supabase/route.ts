import { NextResponse } from 'next/server'
import { isDatabaseAvailable, getSupabaseClient } from '@/lib/database'

export async function GET() {
  try {
    console.log('🔍 Debug: Verificando configuración Supabase...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('📍 NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'configurado' : 'NO configurado')
    console.log('📍 SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'configurado' : 'NO configurado')
    
    const dbAvailable = await isDatabaseAvailable()
    
    if (dbAvailable) {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('job_searches')
        .select('count', { count: 'exact', head: true })
        
      return NextResponse.json({
        success: true,
        debug: {
          supabaseUrl: supabaseUrl ? 'configurado' : 'NO configurado',
          supabaseKey: supabaseKey ? 'configurado' : 'NO configurado',
          dbAvailable,
          testQuery: { data, error: error?.message || null }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        debug: {
          supabaseUrl: supabaseUrl ? 'configurado' : 'NO configurado',
          supabaseKey: supabaseKey ? 'configurado' : 'NO configurado',
          dbAvailable
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      debug: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configurado' : 'NO configurado',
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configurado' : 'NO configurado'
      }
    }, { status: 500 })
  }
}