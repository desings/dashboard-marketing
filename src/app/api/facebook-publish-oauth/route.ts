import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, pageToken, pageId, media } = await request.json()
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })
    }

    if (!pageToken) {
      return NextResponse.json({ 
        error: 'Token de página requerido',
        help: 'Conecta tu página de Facebook primero'
      }, { status: 400 })
    }

    console.log('📤 Publishing to Facebook:', {
      pageId,
      contentLength: content.length,
      hasMedia: media && media.length > 0,
      mediaCount: media ? media.length : 0
    })

    // Si hay media, usar endpoint de photos/videos
    if (media && media.length > 0) {
      console.log('🖼️ Publishing with media...')
      
      // Verificar si son URLs base64 (Vercel)
      const firstMedia = media[0]
      const isBase64 = firstMedia.url && firstMedia.url.startsWith('data:')
      
      if (isBase64) {
        console.log('⚠️ Base64 media detected - Facebook no acepta base64 directamente')
        console.log('📝 Publishing text-only post instead...')
        
        // Facebook no acepta base64, publicar solo texto con nota
        const textWithNote = `${content}\n\n📸 [Imagen adjunta - No visible debido a limitaciones de Vercel]`
        
        const publishUrl = pageId 
          ? `https://graph.facebook.com/v19.0/${pageId}/feed`
          : `https://graph.facebook.com/v19.0/me/feed`

        const publishResponse = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            message: textWithNote,
            access_token: pageToken
          })
        })

        const publishData = await publishResponse.json()

        if (!publishResponse.ok || publishData.error) {
          console.error('❌ Error publishing text with image note:', publishData)
          return NextResponse.json({
            success: false,
            error: 'Error publicando en Facebook',
            details: publishData
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Texto publicado (imagen no soportada en Vercel)',
          postId: publishData.id,
          postUrl: `https://facebook.com/${publishData.id}`,
          note: 'Las imágenes base64 no son soportadas por Facebook API. Solo se publicó el texto.'
        })
      }
      
      // Para posts con media, usar el endpoint de photos
      // Facebook permite subir hasta 10 imágenes en una sola publicación
      if (media.length === 1) {
        // Una sola imagen/video
        const mediaFile = media[0]
        const isVideo = mediaFile.type === 'video'
        
        const mediaUrl = pageId 
          ? `https://graph.facebook.com/v19.0/${pageId}/${isVideo ? 'videos' : 'photos'}`
          : `https://graph.facebook.com/v19.0/me/${isVideo ? 'videos' : 'photos'}`

        console.log(`📸 Publishing single ${isVideo ? 'video' : 'photo'}:`, mediaUrl)

        const publishResponse = await fetch(mediaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            message: content,
            url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${mediaFile.url}`,
            access_token: pageToken
          })
        })

        const publishData = await publishResponse.json()

        if (!publishResponse.ok || publishData.error) {
          console.error('❌ Error publishing media:', publishData)
          return NextResponse.json({
            success: false,
            error: 'Error publicando media en Facebook',
            details: publishData
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `${isVideo ? 'Video' : 'Imagen'} publicado exitosamente en Facebook`,
          postId: publishData.id,
          postUrl: `https://facebook.com/${publishData.id}`
        })

      } else {
        // Múltiples imágenes - crear álbum
        console.log('📸 Publishing multiple images as album...')
        
        // TODO: Implementar álbumes de Facebook
        // Por ahora, publicar solo la primera imagen con el texto
        const firstImage = media[0]
        const photoUrl = pageId 
          ? `https://graph.facebook.com/v19.0/${pageId}/photos`
          : `https://graph.facebook.com/v19.0/me/photos`

        const publishResponse = await fetch(photoUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            message: content + `\n\n(${media.length} archivos multimedia)`,
            url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${firstImage.url}`,
            access_token: pageToken
          })
        })

        const publishData = await publishResponse.json()

        if (!publishResponse.ok || publishData.error) {
          return NextResponse.json({
            success: false,
            error: 'Error publicando álbum en Facebook',
            details: publishData
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Álbum con ${media.length} archivos publicado en Facebook`,
          postId: publishData.id,
          postUrl: `https://facebook.com/${publishData.id}`
        })
      }
    }

    // Publicar solo texto (sin media)
    const publishUrl = pageId 
      ? `https://graph.facebook.com/v19.0/${pageId}/feed`
      : `https://graph.facebook.com/v19.0/me/feed`

    console.log('📝 Publishing text-only post:', publishUrl)

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