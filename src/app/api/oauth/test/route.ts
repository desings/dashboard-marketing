import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = host ? `${protocol}://${host}` : 'https://dashboard-marketing-a62m.vercel.app'

    const facebookConfig = {
      client_id: process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET,
      redirect_uri: `${baseUrl}/api/oauth/facebook/callback`,
      base_url: baseUrl,
      host: host
    }

    // No mostrar el secret por seguridad
    const safeConfig = {
      ...facebookConfig,
      client_secret: facebookConfig.client_secret ? '[CONFIGURADO]' : '[NO CONFIGURADO]'
    }

    return NextResponse.json({
      status: 'OAuth Test Endpoint',
      config: safeConfig,
      test_url: `${baseUrl}/api/oauth/facebook/connect?user_id=test-user`,
      facebook_url: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${facebookConfig.client_id}&redirect_uri=${encodeURIComponent(facebookConfig.redirect_uri)}&scope=public_profile&response_type=code&state=test`
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}