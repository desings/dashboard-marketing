import { NextRequest, NextResponse } from 'next/server'

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

    // Llamada a la API de Facebook para eliminar el post
    const facebookResponse = await fetch(`https://graph.facebook.com/v18.0/${postId}?access_token=${pageToken}`, {
      method: 'DELETE'
    })

    const result = await facebookResponse.json()

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