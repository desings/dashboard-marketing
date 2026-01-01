import { createClient } from '@supabase/supabase-js'

// Configuración con fallback para desarrollo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-key'

// Cliente de Supabase (funcionará en mock si no está configurado)
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface SocialAccount {
  id: string
  user_id: string
  provider: 'facebook' | 'instagram' | 'google' | 'pinterest'
  provider_account_id: string
  provider_account_name?: string
  access_token: string
  refresh_token?: string
  long_lived_token?: string
  expires_at: string
  scopes: string[]
  account_type?: string
  status: 'active' | 'expired' | 'error' | 'revoked'
  error_message?: string
  last_used_at?: string
  created_at: string
  updated_at: string
}

export interface OAuthConfiguration {
  id: string
  tenant_id: string
  provider: 'facebook' | 'instagram' | 'google' | 'pinterest'
  client_id: string
  client_secret: string
  redirect_uri: string
  scopes: string[]
  is_active: boolean
}

export interface ScheduledPost {
  id: string
  user_id: string
  title?: string
  content: string
  media_urls?: string[]
  scheduled_for: string
  status: 'scheduled' | 'published' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface PostPublication {
  id: string
  scheduled_post_id: string
  social_account_id: string
  platform_post_id?: string
  platform_url?: string
  status: 'pending' | 'published' | 'failed'
  error_message?: string
  published_at?: string
  created_at: string
}

// Función para verificar si Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://demo.supabase.co' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'demo-key'
  )
}