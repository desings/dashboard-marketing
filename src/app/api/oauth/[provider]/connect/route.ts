import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el proveedor sea válido
    const validProviders = ['facebook', 'instagram', 'google', 'pinterest']
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Proveedor no soportado' },
        { status: 400 }
      )
    }

    // Si Supabase no está configurado, continuar con demo para Facebook
    if (!isSupabaseConfigured() && provider !== 'facebook') {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=not_configured&provider=${provider}&message=${encodeURIComponent('Supabase no está configurado. Configure las variables de entorno.')}`
      )
    }

    // Si no hay configuración OAuth, mostrar error
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const facebookId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID
    const googleId = process.env.GOOGLE_CLIENT_ID
    
    if (!facebookId && (provider === 'facebook' || provider === 'instagram')) {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=no_credentials&provider=${provider}&message=${encodeURIComponent('Credenciales de Facebook no configuradas')}`
      )
    }

    if (!googleId && provider === 'google') {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=no_credentials&provider=${provider}&message=${encodeURIComponent('Credenciales de Google no configuradas')}`
      )
    }

    // Generar state para seguridad
    const state = Buffer.from(JSON.stringify({
      userId,
      provider,
      timestamp: Date.now()
    })).toString('base64')

    // Construir URL de autorización según el proveedor
    let authUrl: string

    switch (provider) {
      case 'facebook':
        authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
          `client_id=${facebookId}&` +
          `redirect_uri=${encodeURIComponent(baseUrl + '/api/oauth/facebook/callback')}&` +
          `scope=public_profile&` +
          `state=${state}&` +
          `response_type=code`
        break

      case 'instagram':
        authUrl = `https://api.instagram.com/oauth/authorize?` +
          `client_id=${facebookId}&` +
          `redirect_uri=${encodeURIComponent(baseUrl + '/api/oauth/instagram/callback')}&` +
          `scope=instagram_basic,instagram_content_publish&` +
          `state=${state}&` +
          `response_type=code`
        break

      case 'google':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${googleId}&` +
          `redirect_uri=${encodeURIComponent(baseUrl + '/api/oauth/google/callback')}&` +
          `scope=https://www.googleapis.com/auth/youtube.upload&` +
          `state=${state}&` +
          `response_type=code&` +
          `access_type=offline&` +
          `prompt=consent`
        break

      case 'pinterest':
        return NextResponse.redirect(
          `/dashboard/settings?oauth_error=not_implemented&provider=${provider}&message=${encodeURIComponent('Pinterest OAuth no implementado aún')}`
        )

      default:
        return NextResponse.json(
          { error: 'Proveedor no implementado' },
          { status: 500 }
        )
    }

    // Redirigir al usuario al proveedor OAuth
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Error en OAuth connect:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}