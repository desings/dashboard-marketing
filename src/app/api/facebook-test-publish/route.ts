import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })
    }

    // Obtener cuenta de Facebook del localStorage (simulando lo que haría el frontend)
    // En un caso real esto vendría de la base de datos
    let pageToken, pageId;
    
    // Intentar obtener datos de las variables de entorno como fallback
    pageToken = process.env.FACEBOOK_PAGE_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN
    pageId = process.env.FACEBOOK_PAGE_ID
    
    if (!pageToken) {
      return NextResponse.json({ 
        error: 'No hay token de Facebook disponible',
        help: 'Conecta tu cuenta de Facebook primero'
      }, { status: 400 })
    }

    // Publicar en Facebook
    const publishUrl = pageId 
      ? `https://graph.facebook.com/v19.0/${pageId}/feed`  // Página específica
      : `https://graph.facebook.com/v19.0/me/feed`          // Perfil del usuario

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
        error: 'Error publicando en Facebook',
        details: publishData
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Publicación exitosa en Facebook',
      postId: publishData.id,
      publishData
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Error interno',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}