import { NextRequest, NextResponse } from 'next/server'

// Configuración para Next.js 16.1.0
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb', // Aumentado para videos pequeños
    },
  },
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB para imágenes
const MAX_VIDEO_SIZE = 10 * 1024 * 1024 // 10MB para videos (aumentado)
const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo' // Reactivamos videos
]

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [UPLOAD] Starting file upload process (Vercel compatible)...')
    
    // Verificar Content-Length del request
    const contentLength = request.headers.get('content-length')
    console.log('📏 [UPLOAD] Request content-length:', contentLength)
    
    if (contentLength && parseInt(contentLength) > MAX_VIDEO_SIZE) {
      return NextResponse.json({ 
        error: `Archivo demasiado grande. Máximo: 10MB para videos, 5MB para imágenes. Actual: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB` 
      }, { status: 413 })
    }
    
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    console.log('📋 [UPLOAD] Received files:', files.length)
    
    if (!files || files.length === 0) {
      console.log('❌ [UPLOAD] No files provided')
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      console.log('🔍 [UPLOAD] Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      if (file.size === 0) {
        console.log('⚠️  [UPLOAD] Skipping empty file:', file.name)
        continue
      }
      
      // Determinar si es imagen o video
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
      
      // Validar tamaño según tipo
      if (file.size > maxSize) {
        console.log('❌ [UPLOAD] File too large:', file.name, file.size)
        return NextResponse.json({ 
          error: `El archivo "${file.name}" es demasiado grande. Máximo: ${isVideo ? '10MB para videos' : '5MB para imágenes'}\n\n💡 Para videos grandes (>10MB):\n- Usa YouTube o Vimeo\n- Comprime el video\n- Divide en clips más cortos` 
        }, { status: 400 })
      }

      // Validar tipo
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.log('❌ [UPLOAD] Invalid file type:', file.name, file.type)
        return NextResponse.json({ 
          error: `El archivo "${file.name}" tiene un tipo no válido: ${file.type}\n\nTipos permitidos:\n- Imágenes: JPG, PNG, GIF, WebP\n- Videos: MP4, MOV, AVI` 
        }, { status: 400 })
      }
      
      try {
        // Convertir a base64 (compatible con Vercel)
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`
        
        console.log('✅ [UPLOAD] File converted to base64:', {
          fileName: file.name,
          originalSize: file.size,
          base64Size: base64.length
        })
        
        // Generar ID único
        const timestamp = Date.now()
        const fileId = `media_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
        
        uploadedFiles.push({
          id: fileId,
          fileName: file.name,
          originalName: file.name,
          url: dataUrl, // Base64 data URL
          type: isVideo ? 'video' : 'image',
          size: file.size,
          isBase64: true,
          isVideo: isVideo
        })
        
      } catch (convertError) {
        console.error('❌ [UPLOAD] Error converting file:', {
          fileName: file.name,
          error: convertError
        })
        return NextResponse.json({ 
          error: `Error procesando archivo "${file.name}": ${convertError instanceof Error ? convertError.message : 'Error desconocido'}` 
        }, { status: 500 })
      }
    }

    console.log('🎉 [UPLOAD] All files processed successfully:', uploadedFiles.length)

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    })

  } catch (error) {
    console.error('❌ [UPLOAD] Error uploading files:', error)
    
    // Errores específicos
    if (error instanceof Error) {
      if (error.message.includes('request entity too large')) {
        return NextResponse.json({ 
          error: 'Archivo demasiado grande. Máximo: 50MB' 
        }, { status: 413 })
      }
      
      if (error.message.includes('Invalid form data')) {
        return NextResponse.json({ 
          error: 'Datos de formulario inválidos. Verifica el archivo.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: `Error de upload: ${error.message}` 
      }, { status: 500 })
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor durante upload' },
      { status: 500 }
    )
  }
}