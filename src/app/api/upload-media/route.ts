import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Configuración para Next.js 16.1.0
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
]

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [UPLOAD] Starting file upload process...')
    
    // Verificar Content-Length del request
    const contentLength = request.headers.get('content-length')
    console.log('📏 [UPLOAD] Request content-length:', contentLength)
    
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Request too large. Maximum size: 50MB. Current: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB` 
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
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'media')

    console.log('📁 [UPLOAD] Upload directory:', uploadsDir)

    // Asegurar que existe el directorio
    try {
      await fs.mkdir(uploadsDir, { recursive: true })
      console.log('✅ [UPLOAD] Directory ensured:', uploadsDir)
      
      // Verificar permisos de escritura
      await fs.access(uploadsDir, fs.constants.W_OK)
      console.log('✅ [UPLOAD] Directory is writable')
    } catch (dirError) {
      console.error('❌ [UPLOAD] Directory error:', dirError)
      return NextResponse.json({ 
        error: `Error accessing upload directory: ${dirError instanceof Error ? dirError.message : 'Unknown error'}` 
      }, { status: 500 })
    }

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
      
      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        console.log('❌ [UPLOAD] File too large:', file.name, file.size)
        return NextResponse.json({ 
          error: `File ${file.name} is too large. Maximum size: 50MB` 
        }, { status: 400 })
      }

      // Validar tipo
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.log('❌ [UPLOAD] Invalid file type:', file.name, file.type)
        return NextResponse.json({ 
          error: `File ${file.name} has invalid type: ${file.type}` 
        }, { status: 400 })
      }
      
      // Generar nombre único y seguro
      const timestamp = Date.now()
      const fileExtension = path.extname(file.name).toLowerCase()
      const baseName = path.basename(file.name, fileExtension)
      
      // Limpiar nombre: solo letras, números, guiones y puntos
      const cleanBaseName = baseName
        .normalize('NFD') // Normalizar caracteres con acentos
        .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos)
        .replace(/[^a-zA-Z0-9\-_]/g, '_') // Reemplazar caracteres especiales
        .replace(/_{2,}/g, '_') // Reemplazar múltiples guiones bajos con uno solo
        .replace(/^_+|_+$/g, '') // Remover guiones bajos al inicio y final
        
      // Agregar un número aleatorio para evitar conflictos
      const randomSuffix = Math.random().toString(36).substr(2, 6)
      const fileName = `${timestamp}-${cleanBaseName}-${randomSuffix}${fileExtension}`
      const filePath = path.join(uploadsDir, fileName)
      
      // Verificar que el archivo no existe (doble seguridad)
      let finalFilePath = filePath
      let finalFileName = fileName
      let counter = 1
      
      while (await fs.access(finalFilePath).then(() => true).catch(() => false)) {
        finalFileName = `${timestamp}-${cleanBaseName}-${randomSuffix}-${counter}${fileExtension}`
        finalFilePath = path.join(uploadsDir, finalFileName)
        counter++
      }
      
      console.log('💾 [UPLOAD] File naming:', {
        originalName: file.name,
        cleanBaseName,
        fileName: finalFileName,
        filePath: finalFilePath
      })
      
      try {
        // Verificar que el directorio sea accesible
        await fs.access(uploadsDir, fs.constants.W_OK)
        
        // Escribir archivo
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        console.log('📝 [UPLOAD] Writing file:', {
          fileName: finalFileName,
          bufferSize: buffer.length,
          targetPath: finalFilePath
        })
        
        await fs.writeFile(finalFilePath, buffer)
        
        // Verificar que el archivo se escribió correctamente
        const stats = await fs.stat(finalFilePath)
        console.log('✅ [UPLOAD] File written successfully:', {
          fileName: finalFileName,
          fileSize: stats.size,
          isFile: stats.isFile()
        })
        
        uploadedFiles.push({
          id: `media_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          fileName: finalFileName,
          originalName: file.name,
          url: `/uploads/media/${finalFileName}`,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          size: file.size
        })
      } catch (writeError) {
        console.error('❌ [UPLOAD] Error writing file:', {
          fileName: file.name,
          cleanFileName: finalFileName,
          error: writeError,
          errorMessage: writeError instanceof Error ? writeError.message : 'Unknown error'
        })
        return NextResponse.json({ 
          error: `Error guardando archivo "${file.name}": ${writeError instanceof Error ? writeError.message : 'Error desconocido'}` 
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