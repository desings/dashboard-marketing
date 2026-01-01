import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, pageToken, pageId } = await request.json()
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })
    }

    if (!pageToken) {
      return NextResponse.json({ 
        error: 'Token de página requerido',
        help: 'Conecta tu página de Facebook primero'
      }, { status: 400 })
    }

    // Publicar en Facebook
    const publishUrl = pageId 
      ? `https://graph.facebook.com/v19.0/${pageId}/feed`  // Página específica
      : `https://graph.facebook.com/v19.0/me/feed`          // Perfil del usuario

    console.log('Publishing to:', publishUrl)
    console.log('Page ID:', pageId)
    console.log('Content:', content.substring(0, 50) + '...')

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        message: content,
        access_token: pageToken
      })
    })

    const publishData = await publishResponse.json()

    if (!publishResponse.ok || publishData.error) {
      return NextResponse.json({
        success: false,
        error: 'Error publicando en Facebook',
        details: publishData
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Publicación exitosa en Facebook',
      postId: publishData.id,
      postUrl: `https://facebook.com/${publishData.id}`
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}