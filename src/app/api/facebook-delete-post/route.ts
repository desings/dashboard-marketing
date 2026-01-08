import { NextRequest, NextResponse } from 'next/server'

// Usar POST para evitar problemas con proxies/servidores que bloquean DELETE
export async function POST(request: NextRequest) {
  try {
    const { postId, pageToken } = await request.json()
    
    if (!postId) {
      return NextResponse.json({ error: 'Post ID requerido' }, { status: 400 })
    }

    if (!pageToken) {
      return NextResponse.json({ 
        error: 'Token de acceso de Facebook requerido',
        success: false 
      }, { status: 401 })
    }

    console.log('🗑️ [FACEBOOK DELETE] Intentando eliminar post:', postId)
    console.log('🔑 [FACEBOOK DELETE] Token preview:', pageToken.substring(0, 20) + '...')

    // Llamada a la API de Facebook para eliminar el post
    const deleteUrl = `https://graph.facebook.com/v18.0/${postId}?access_token=${pageToken}`
    console.log('🌐 [FACEBOOK DELETE] URL de eliminación:', deleteUrl.replace(pageToken, 'TOKEN_HIDDEN'))
    
    const facebookResponse = await fetch(deleteUrl, {
      method: 'DELETE'
    })

    console.log('📡 [FACEBOOK DELETE] Status de respuesta:', facebookResponse.status)
    
    let result
    try {
      result = await facebookResponse.json()
      console.log('📄 [FACEBOOK DELETE] Respuesta de Facebook:', result)
    } catch (jsonError) {
      console.error('❌ [FACEBOOK DELETE] Error parseando JSON:', jsonError)
      result = { error: { message: 'Error parseando respuesta de Facebook' } }
    }

    if (!facebookResponse.ok) {
      console.error('❌ [FACEBOOK DELETE] Error de Facebook:', result)
      
      // Si el post ya no existe en Facebook, considerarlo como éxito
      if (result.error?.code === 100 || result.error?.message?.includes('does not exist')) {
        console.log('✅ [FACEBOOK DELETE] Post ya no existe en Facebook (considerado éxito)')
        return NextResponse.json({ 
          success: true, 
          message: 'El post ya no existe en Facebook',
          alreadyDeleted: true 
        })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: `Error de Facebook: ${result.error?.message || 'Error desconocido'}`,
        facebookError: result.error 
      }, { status: 400 })
    }

    console.log('✅ [FACEBOOK DELETE] Post eliminado exitosamente de Facebook:', postId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Post eliminado exitosamente de Facebook',
      facebookResponse: result 
    })

  } catch (error) {
    console.error('❌ [FACEBOOK DELETE] Error interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido') 
    }, { status: 500 })
  }
}

// Mantener DELETE como fallback
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const pageToken = searchParams.get('pageToken')
    
    if (!postId) {
      return NextResponse.json({ error: 'Post ID requerido' }, { status: 400 })
    }

    if (!pageToken) {
      return NextResponse.json({ 
        error: 'Token de acceso de Facebook requerido',
        success: false 
      }, { status: 401 })
    }

    console.log('🗑️ [FACEBOOK DELETE] Intentando eliminar post:', postId)
    console.log('🔑 [FACEBOOK DELETE] Token preview:', pageToken.substring(0, 20) + '...')

    // Llamada a la API de Facebook para eliminar el post
    const deleteUrl = `https://graph.facebook.com/v18.0/${postId}?access_token=${pageToken}`
    console.log('🌐 [FACEBOOK DELETE] URL de eliminación:', deleteUrl.replace(pageToken, 'TOKEN_HIDDEN'))
    
    const facebookResponse = await fetch(deleteUrl, {
      method: 'DELETE'
    })

    console.log('📡 [FACEBOOK DELETE] Status de respuesta:', facebookResponse.status)
    
    let result
    try {
      result = await facebookResponse.json()
      console.log('📄 [FACEBOOK DELETE] Respuesta de Facebook:', result)
    } catch (jsonError) {
      console.error('❌ [FACEBOOK DELETE] Error parseando JSON:', jsonError)
      result = { error: { message: 'Error parseando respuesta de Facebook' } }
    }

    if (!facebookResponse.ok) {
      console.error('❌ [FACEBOOK DELETE] Error de Facebook:', result)
      
      // Si el post ya no existe en Facebook, considerarlo como éxito
      if (result.error?.code === 100 || result.error?.message?.includes('does not exist')) {
        console.log('✅ [FACEBOOK DELETE] Post ya no existe en Facebook (considerado éxito)')
        return NextResponse.json({ 
          success: true, 
          message: 'El post ya no existe en Facebook',
          alreadyDeleted: true 
        })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: `Error de Facebook: ${result.error?.message || 'Error desconocido'}`,
        facebookError: result.error 
      }, { status: 400 })
    }

    console.log('✅ [FACEBOOK DELETE] Post eliminado exitosamente de Facebook:', postId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Post eliminado exitosamente de Facebook',
      facebookResponse: result 
    })

  } catch (error) {
    console.error('❌ [FACEBOOK DELETE] Error interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido') 
    }, { status: 500 })
  }
}