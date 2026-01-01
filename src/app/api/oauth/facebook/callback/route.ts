import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.json({
        error: 'OAuth error',
        details: error,
        description: searchParams.get('error_description')
      }, { status: 400 })
    }

    if (!code || !state) {
      return NextResponse.json({
        error: 'Missing parameters',
        code: !!code,
        state: !!state
      }, { status: 400 })
    }

    // Decodificar state
    let stateData: any
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.json({
        error: 'Invalid state',
        state_received: state
      }, { status: 400 })
    }

    // Intercambiar código por token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent('https://dashboard-marketing-a62m.vercel.app/api/oauth/facebook/callback')}&` +
      `code=${code}`
    )

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      return NextResponse.json({
        error: 'Token exchange failed',
        details: tokenData,
        config: {
          client_id: process.env.FACEBOOK_APP_ID,
          has_secret: !!process.env.FACEBOOK_APP_SECRET
        }
      }, { status: 400 })
    }

    // Obtener perfil del usuario
    const profileResponse = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.access_token}`
    )

    const profileData = await profileResponse.json()

    if (!profileResponse.ok || profileData.error) {
      return NextResponse.json({
        error: 'Profile fetch failed',
        details: profileData
      }, { status: 400 })
    }

    // Guardar cuenta conectada para mostrar en la UI
    const connectedAccount = {
      id: `facebook-${profileData.id}`,
      provider: 'facebook',
      provider_account_name: profileData.name,
      account_type: 'user',
      status: 'active',
      scopes: ['public_profile'],
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 días
      created_at: new Date().toISOString()
    }

    // Éxito - redirigir al dashboard
    return NextResponse.redirect(
      `https://dashboard-marketing-a62m.vercel.app/dashboard/settings?oauth_success=facebook&account=${encodeURIComponent(profileData.name)}&account_data=${encodeURIComponent(JSON.stringify(connectedAccount))}`
    )

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}