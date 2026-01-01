import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Verificar si hubo error en la autorización
    if (error) {
      const errorDescription = searchParams.get('error_description')
      console.error(`Error OAuth ${provider}:`, error, errorDescription)
      
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=${encodeURIComponent(error)}&provider=${provider}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=missing_params&provider=${provider}`
      )
    }

    // Decodificar y validar state
    let stateData: any
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=invalid_state&provider=${provider}`
      )
    }

    const { userId, provider: stateProvider, timestamp } = stateData

    // Validaciones de seguridad
    if (stateProvider !== provider) {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=provider_mismatch&provider=${provider}`
      )
    }

    // Verificar que el state no tenga más de 10 minutos
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=state_expired&provider=${provider}`
      )
    }

    // Obtener configuración OAuth
    const { data: config, error: configError } = await supabase
      .from('oauth_configurations')
      .select('*')
      .eq('provider', provider)
      .eq('is_active', true)
      .single()

    if (configError || !config) {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=config_not_found&provider=${provider}`
      )
    }

    // Intercambiar código por token según el proveedor
    let tokenData: any

    switch (provider) {
      case 'facebook':
        tokenData = await exchangeFacebookCode(code, config)
        break
      case 'instagram':
        tokenData = await exchangeInstagramCode(code, config)
        break
      case 'google':
        tokenData = await exchangeGoogleCode(code, config)
        break
      case 'pinterest':
        tokenData = await exchangePinterestCode(code, config)
        break
      default:
        return NextResponse.redirect(
          `/dashboard/settings?oauth_error=provider_not_implemented&provider=${provider}`
        )
    }

    if (!tokenData.success) {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=token_exchange_failed&provider=${provider}&details=${encodeURIComponent(tokenData.error)}`
      )
    }

    // Obtener información del perfil del usuario
    const profileData = await getProviderProfile(provider, tokenData.access_token)
    
    if (!profileData.success) {
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=profile_fetch_failed&provider=${provider}`
      )
    }

    // Guardar o actualizar cuenta social en Supabase
    const accountData = {
      user_id: userId,
      provider,
      provider_account_id: profileData.id,
      provider_account_name: profileData.name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      long_lived_token: tokenData.long_lived_token,
      expires_at: tokenData.expires_at,
      scopes: tokenData.scopes || config.scopes,
      account_type: profileData.account_type,
      status: 'active' as const
    }

    const { error: upsertError } = await supabase
      .from('social_accounts')
      .upsert(accountData, {
        onConflict: 'user_id,provider,provider_account_id'
      })

    if (upsertError) {
      console.error('Error guardando cuenta social:', upsertError)
      return NextResponse.redirect(
        `/dashboard/settings?oauth_error=save_failed&provider=${provider}`
      )
    }

    // Redirigir con éxito
    return NextResponse.redirect(
      `/dashboard/settings?oauth_success=${provider}&account=${encodeURIComponent(profileData.name)}`
    )

  } catch (error) {
    console.error('Error en OAuth callback:', error)
    return NextResponse.redirect(
      `/dashboard/settings?oauth_error=internal_error`
    )
  }
}

// Funciones auxiliares para intercambio de tokens

async function exchangeFacebookCode(code: string, config: any) {
  try {
    // Intercambiar código por access token corto
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${config.client_id}&` +
      `client_secret=${config.client_secret}&` +
      `redirect_uri=${config.redirect_uri}&` +
      `code=${code}`
    )

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      return { success: false, error: tokenData.error?.message || 'Token exchange failed' }
    }

    // Intercambiar por long-lived token
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${config.client_id}&` +
      `client_secret=${config.client_secret}&` +
      `fb_exchange_token=${tokenData.access_token}`
    )

    const longLivedData = await longLivedResponse.json()

    if (!longLivedResponse.ok || longLivedData.error) {
      // Si falla el long-lived token, usar el corto
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 2) // 2 horas por defecto

      return {
        success: true,
        access_token: tokenData.access_token,
        expires_at: expiresAt.toISOString(),
        scopes: config.scopes
      }
    }

    // Calcular expiración (60 días para long-lived tokens)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    return {
      success: true,
      access_token: longLivedData.access_token,
      long_lived_token: longLivedData.access_token,
      expires_at: expiresAt.toISOString(),
      scopes: config.scopes
    }

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function exchangeInstagramCode(code: string, config: any) {
  // Instagram usa el mismo flujo que Facebook
  return await exchangeFacebookCode(code, config)
}

async function exchangeGoogleCode(code: string, config: any) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.client_id,
        client_secret: config.client_secret,
        redirect_uri: config.redirect_uri
      })
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      return { success: false, error: data.error || 'Token exchange failed' }
    }

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in)

    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt.toISOString(),
      scopes: data.scope?.split(' ') || config.scopes
    }

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function exchangePinterestCode(code: string, config: any) {
  try {
    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.client_id,
        client_secret: config.client_secret,
        redirect_uri: config.redirect_uri
      })
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      return { success: false, error: data.error || 'Token exchange failed' }
    }

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in)

    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt.toISOString(),
      scopes: data.scope?.split(',') || config.scopes
    }

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Funciones para obtener perfil del usuario

async function getProviderProfile(provider: string, accessToken: string) {
  try {
    switch (provider) {
      case 'facebook':
        const fbResponse = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${accessToken}`
        )
        const fbData = await fbResponse.json()
        
        if (!fbResponse.ok) {
          return { success: false, error: fbData.error }
        }

        return {
          success: true,
          id: fbData.id,
          name: fbData.name,
          email: fbData.email,
          account_type: 'user'
        }

      case 'instagram':
        const igResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
        )
        const igData = await igResponse.json()
        
        if (!igResponse.ok) {
          return { success: false, error: igData.error }
        }

        return {
          success: true,
          id: igData.id,
          name: igData.username,
          account_type: 'user'
        }

      case 'google':
        const googleResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
        )
        const googleData = await googleResponse.json()
        
        if (!googleResponse.ok) {
          return { success: false, error: googleData.error }
        }

        return {
          success: true,
          id: googleData.id,
          name: googleData.name,
          email: googleData.email,
          account_type: 'user'
        }

      case 'pinterest':
        const pinterestResponse = await fetch(
          'https://api.pinterest.com/v5/user_account',
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )
        const pinterestData = await pinterestResponse.json()
        
        if (!pinterestResponse.ok) {
          return { success: false, error: pinterestData.error }
        }

        return {
          success: true,
          id: pinterestData.id,
          name: pinterestData.username,
          account_type: 'user'
        }

      default:
        return { success: false, error: 'Proveedor no soportado' }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}