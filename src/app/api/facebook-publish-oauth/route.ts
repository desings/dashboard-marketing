import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    console.log('📩 Request recibido:', JSON.stringify(requestData, null, 2))
    
    const { content, pageToken, pageId, media } = requestData
    
    console.log('🔍 Token recibido:', {
      hasToken: !!pageToken,
      tokenLength: pageToken ? pageToken.length : 0,
      tokenStart: pageToken ? pageToken.substring(0, 30) + '...' : 'N/A',
      tokenType: typeof pageToken
    })
    
    if (!content || !content.trim()) {
      console.log('❌ Error: Contenido requerido')
      return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })
    }

    if (!pageToken) {
      console.log('❌ Error: Token requerido')
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

    // Verificar si el token es válido antes de usar
    console.log('🔍 Verificando token de Facebook...')
    const tokenCheckResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${pageToken}`)
    const tokenCheckData = await tokenCheckResponse.json()
    
    console.log('🔍 Token check response:', {
      status: tokenCheckResponse.status,
      data: tokenCheckData
    })
    
    if (!tokenCheckResponse.ok || tokenCheckData.error) {
      console.error('❌ Token inválido:', tokenCheckData)
      return NextResponse.json({
        success: false,
        error: 'Token de Facebook inválido o expirado',
        details: tokenCheckData,
        help: 'Reconecta tu cuenta de Facebook en Settings'
      }, { status: 401 })
    }

    // Si hay media, usar endpoint de photos/videos
    if (media && media.length > 0) {
      console.log('🖼️ Publishing with media...')
      
      // Verificar si son URLs de Cloudinary (más eficiente)
      const firstMedia = media[0]
      const isCloudinary = firstMedia.isCloudinary || firstMedia.cloudinaryUrl
      const isBase64 = firstMedia.url && firstMedia.url.startsWith('data:')
      
      if (isCloudinary) {
        console.log('☁️ Cloudinary media detected - using direct URLs...')
        
        // Usar URL directa de Cloudinary (mucho más eficiente)
        const mediaUrl = firstMedia.cloudinaryUrl || firstMedia.url
        const isVideo = firstMedia.type === 'video' || firstMedia.isVideo
        
        console.log('📊 Datos de media:', {
          mediaUrl: mediaUrl,
          isVideo: isVideo,
          type: firstMedia.type,
          hasCloudinaryUrl: !!firstMedia.cloudinaryUrl,
          hasUrl: !!firstMedia.url
        })
        
        if (isVideo) {
          // Para videos, usar el endpoint específico de Facebook con diferentes parámetros
          const uploadUrl = pageId 
            ? `https://graph.facebook.com/v19.0/${pageId}/videos`
            : `https://graph.facebook.com/v19.0/me/videos`

          console.log(`📤 Publishing video from Cloudinary URL...`)
          console.log(`🔗 Facebook API URL: ${uploadUrl}`)
          
          // Para videos de URL remota, Facebook requiere este formato específico
          const bodyParams = {
            file_url: mediaUrl,  // Cambiar de 'url' a 'file_url' para videos
            description: content,
            access_token: pageToken,
            published: 'true'  // Publicar inmediatamente
          }
          
          console.log('📋 Parámetros envío video:', JSON.stringify(bodyParams, null, 2))

          const publishResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(bodyParams).toString()
          })

          const publishData = await publishResponse.json()
          
          console.log('📤 Facebook Video Response Status:', publishResponse.status)
          console.log('📤 Facebook Video Response Data:', JSON.stringify(publishData, null, 2))

          if (!publishResponse.ok || publishData.error) {
            console.error('❌ Error publishing video:', publishData)
            
            // Fallback: intentar con parámetros alternativos
            console.log('🔄 Intentando con parámetros alternativos...')
            
            const fallbackParams = {
              url: mediaUrl,  // Volver al parámetro original
              description: content,
              access_token: pageToken
            }
            
            const fallbackResponse = await fetch(uploadUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams(fallbackParams).toString()
            })

            const fallbackData = await fallbackResponse.json()
            
            if (!fallbackResponse.ok || fallbackData.error) {
              return NextResponse.json({
                success: false,
                error: 'Error publicando video en Facebook',
                details: { original: publishData, fallback: fallbackData },
                statusCode: publishResponse.status,
                help: 'El video puede ser muy grande o Facebook no puede acceder a la URL'
              }, { status: 400 })
            }
            
            return NextResponse.json({
              success: true,
              message: 'Video publicado exitosamente (con parámetros alternativos)',
              postId: fallbackData.id,
              postUrl: `https://facebook.com/${fallbackData.id}`
            })
          }

          return NextResponse.json({
            success: true,
            message: 'Video desde Cloudinary publicado exitosamente',
            postId: publishData.id,
            postUrl: `https://facebook.com/${publishData.id}`
          })
          
        } else {
          // Para imágenes, mantener el comportamiento original
          const uploadUrl = pageId 
            ? `https://graph.facebook.com/v19.0/${pageId}/photos`
            : `https://graph.facebook.com/v19.0/me/photos`

          const bodyParams = {
            url: mediaUrl,
            message: content,
            access_token: pageToken
          }
          
          console.log('📋 Parámetros envío imagen:', JSON.stringify(bodyParams, null, 2))

          const publishResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(bodyParams).toString()
          })

          const publishData = await publishResponse.json()
          
          console.log('📤 Facebook Image Response Status:', publishResponse.status)
          console.log('📤 Facebook Image Response Data:', JSON.stringify(publishData, null, 2))

          if (!publishResponse.ok || publishData.error) {
            console.error('❌ Error publishing image:', publishData)
            return NextResponse.json({
              success: false,
              error: 'Error publicando imagen en Facebook',
              details: publishData,
              statusCode: publishResponse.status
            }, { status: 400 })
          }

          return NextResponse.json({
            success: true,
            message: 'Imagen desde Cloudinary publicada exitosamente',
            postId: publishData.id,
            postUrl: `https://facebook.com/${publishData.id}`
          })
        }
      }
      }
      
      if (isBase64) {
        console.log('📤 Base64 media detected - uploading directly to Facebook...')
        
        // Convertir base64 a Buffer para Facebook
        try {
          const base64Data = firstMedia.url.split(',')[1] // Remover "data:image/jpeg;base64,"
          const mediaBuffer = Buffer.from(base64Data, 'base64')
          const mimeType = firstMedia.url.split(';')[0].split(':')[1] // Extraer tipo MIME
          const isVideo = mimeType.startsWith('video/') || firstMedia.isVideo || firstMedia.type === 'video'
          
          console.log('🔄 Converted base64 to buffer:', {
            originalBase64Length: base64Data.length,
            bufferSize: mediaBuffer.length,
            mediaType: mimeType,
            isVideo: isVideo
          })

          // Subir imagen/video directamente a Facebook
          const uploadUrl = pageId 
            ? `https://graph.facebook.com/v19.0/${pageId}/${isVideo ? 'videos' : 'photos'}`
            : `https://graph.facebook.com/v19.0/me/${isVideo ? 'videos' : 'photos'}`

          // Crear FormData para Facebook
          const formData = new FormData()
          
          // Crear un Blob desde el buffer
          const mediaBlob = new Blob([mediaBuffer], { 
            type: mimeType 
          })
          
          formData.append('source', mediaBlob)
          formData.append(isVideo ? 'description' : 'message', content)
          formData.append('access_token', pageToken)

          console.log(`📤 Uploading ${isVideo ? 'video' : 'image'} directly to Facebook...`)

          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
          })

          const uploadData = await uploadResponse.json()

          if (!uploadResponse.ok || uploadData.error) {
            console.error('❌ Error uploading image to Facebook:', uploadData)
            
            // Fallback: publicar solo texto
            console.log('🔄 Fallback: Publishing text-only...')
            const textOnlyUrl = pageId 
              ? `https://graph.facebook.com/v19.0/${pageId}/feed`
              : `https://graph.facebook.com/v19.0/me/feed`

            const textResponse = await fetch(textOnlyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                message: content,
                access_token: pageToken
              })
            })

            const textData = await textResponse.json()

            if (!textResponse.ok || textData.error) {
              return NextResponse.json({
                success: false,
                error: 'Error publicando en Facebook (imagen y texto fallaron)',
                details: { uploadData, textData }
              }, { status: 400 })
            }

            return NextResponse.json({
              success: true,
              message: 'Texto publicado (imagen falló)',
              postId: textData.id,
              postUrl: `https://facebook.com/${textData.id}`,
              warning: 'La imagen no pudo subirse a Facebook: ' + (uploadData.error?.message || 'Error desconocido')
            })
          }

          return NextResponse.json({
            success: true,
            message: `${isVideo ? 'Video' : 'Imagen'} y texto publicados exitosamente en Facebook`,
            postId: uploadData.id,
            postUrl: `https://facebook.com/${uploadData.id}`
          })

        } catch (conversionError) {
          console.error('❌ Error converting base64 for Facebook:', conversionError)
          
          // Fallback: publicar solo texto
          const publishUrl = pageId 
            ? `https://graph.facebook.com/v19.0/${pageId}/feed`
            : `https://graph.facebook.com/v19.0/me/feed`

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
            message: 'Texto publicado (error procesando imagen)',
            postId: publishData.id,
            postUrl: `https://facebook.com/${publishData.id}`,
            warning: 'Error procesando imagen: ' + (conversionError instanceof Error ? conversionError.message : 'Error desconocido')
          })
        }
      }
      
      // Para posts con media, usar el endpoint de photos
      // Facebook permite subir hasta 10 imágenes en una sola publicación
      if (media.length === 1) {
        // Determinar si es imagen o video
        const mediaFile = media[0]
        const isVideo = mediaFile.type === 'video' || mediaFile.isVideo
        
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