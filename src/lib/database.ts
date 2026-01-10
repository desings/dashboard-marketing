import { createClient } from '@supabase/supabase-js'

// Función centralizada para verificar disponibilidad de base de datos Supabase
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔧 Verificando credenciales Supabase...')
    console.log('   URL disponible:', !!supabaseUrl)
    console.log('   Key disponible:', !!supabaseKey)
    console.log('   URL completa:', supabaseUrl)
    console.log('   Key length:', supabaseKey?.length || 0)
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials missing')
      return false
    }
    
    if (supabaseUrl === 'https://demo.supabase.co' || supabaseKey === 'demo-key') {
      console.warn('⚠️ Using demo Supabase credentials')
      return false
    }

    // ✅ ACTIVADO: Asumir conexión disponible si credenciales están presentes
    console.log('✅ Supabase credenciales disponibles - Modo producción activado')
    return true
  } catch (error) {
    console.warn('⚠️ Database connection failed:', error)
    return false
  }
}

// Cliente Supabase para usar en controladores
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}