import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { shortToken } = await request.json()

    if (!shortToken) {
      return NextResponse.json({
        error: 'Token requerido'
      }, { status: 400 })
    }

    // Intercambiar token de corta duración por uno de larga duración
    const longTokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `fb_exchange_token=${shortToken}`
    )

    const longTokenData = await longTokenResponse.json()

    if (!longTokenResponse.ok || longTokenData.error) {
      console.error('Error getting long-lived token:', longTokenData)
      return NextResponse.json({
        error: 'Failed to get long-lived token',
        details: longTokenData
      }, { status: 400 })
    }

    // Obtener información de páginas con el nuevo token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longTokenData.access_token}`
    )

    const pagesData = await pagesResponse.json()

    if (!pagesResponse.ok || pagesData.error) {
      console.error('Error getting pages with long token:', pagesData)
      return NextResponse.json({
        error: 'Failed to get pages with long-lived token',
        details: pagesData
      }, { status: 400 })
    }

    // El token de página ya es de larga duración
    const pageInfo = pagesData.data && pagesData.data.length > 0 ? {
      pageId: pagesData.data[0].id,
      pageName: pagesData.data[0].name,
      pageToken: pagesData.data[0].access_token, // Este es el token de larga duración de la página
      longLivedUserToken: longTokenData.access_token
    } : null

    console.log('✅ Long-lived token generated:', {
      hasPageToken: !!pageInfo?.pageToken,
      hasUserToken: !!pageInfo?.longLivedUserToken,
      expiresIn: longTokenData.expires_in || 'never (page tokens don\'t expire)'
    })

    return NextResponse.json({
      success: true,
      pageInfo: pageInfo,
      userTokenExpiresIn: longTokenData.expires_in
    })

  } catch (error) {
    console.error('Error in refresh token endpoint:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}