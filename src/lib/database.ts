import { createClient } from '@supabase/supabase-js'

// Función centralizada para verificar disponibilidad de base de datos Supabase
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials missing')
      return false
    }
    
    if (supabaseUrl === 'https://demo.supabase.co' || supabaseKey === 'demo-key') {
      console.warn('⚠️ Using demo Supabase credentials')
      return false
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Probar conexión haciendo una consulta simple
    const { error } = await supabase
      .from('job_searches')
      .select('count', { count: 'exact', head: true })
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabla no existe (OK para primera vez)
      console.warn('⚠️ Supabase connection failed:', error.message)
      return false
    }
    
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