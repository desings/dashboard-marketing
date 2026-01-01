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

    // Obtener páginas que el usuario administra
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${tokenData.access_token}`
    )

    const pagesData = await pagesResponse.json()

    if (!pagesResponse.ok || pagesData.error) {
      console.warn('Could not fetch pages:', pagesData.error)
      // Continuar sin páginas si falla
    }

    // Guardar información de páginas para publicación
    const pageInfo = pagesData.data && pagesData.data.length > 0 ? {
      pageId: pagesData.data[0].id,
      pageName: pagesData.data[0].name,
      pageToken: pagesData.data[0].access_token
    } : null

    // Guardar cuenta conectada para mostrar en la UI
    const connectedAccount = {
      id: `facebook-${profileData.id}`,
      provider: 'facebook',
      provider_account_name: pageInfo ? pageInfo.pageName : profileData.name,
      account_type: pageInfo ? 'page' : 'user',
      status: 'active',
      scopes: ['pages_manage_posts', 'pages_show_list', 'public_profile'],
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 días
      created_at: new Date().toISOString(),
      pageId: pageInfo?.pageId,
      pageToken: pageInfo?.pageToken
    }

    // Éxito - redirigir al dashboard
    return NextResponse.redirect(
      `https://dashboard-marketing-a62m.vercel.app/dashboard/settings?oauth_success=facebook&account=${encodeURIComponent(pageInfo ? pageInfo.pageName : profileData.name)}&account_data=${encodeURIComponent(JSON.stringify(connectedAccount))}`
    )

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}