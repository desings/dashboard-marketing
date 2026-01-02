import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    console.log('☁️ [CLOUDINARY] Starting upload to Cloudinary...')

    // Verificar configuración
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({
        error: 'Cloudinary not configured. Please set environment variables.',
        required: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
      }, { status: 500 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      console.log('📤 [CLOUDINARY] Processing file:', {
        name: file.name,
        size: Math.round(file.size / 1024 / 1024 * 100) / 100 + ' MB',
        type: file.type
      })

      try {
        // Convertir archivo a buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Determinar tipo de recurso
        const isVideo = file.type.startsWith('video/')
        const resourceType = isVideo ? 'video' : 'image'
        
        // Configurar opciones de upload
        const uploadOptions = {
          resource_type: resourceType as 'image' | 'video',
          folder: 'dashboard-marketing',
          public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          overwrite: false,
          // Para videos, optimizar automáticamente
          ...(isVideo && {
            video_codec: 'auto',
            quality: 'auto',
            format: 'mp4'
          }),
          // Para imágenes, optimizar también
          ...(!isVideo && {
            quality: 'auto',
            format: 'auto'
          })
        }

        console.log('⬆️ [CLOUDINARY] Uploading to Cloudinary...', {
          resourceType,
          folder: uploadOptions.folder,
          optimization: isVideo ? 'video optimized' : 'image optimized'
        })

        // Subir a Cloudinary usando upload_stream
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                console.error('❌ [CLOUDINARY] Upload error:', error)
                reject(error)
              } else {
                console.log('✅ [CLOUDINARY] Upload successful:', {
                  publicId: result?.public_id,
                  url: result?.secure_url,
                  format: result?.format,
                  size: result?.bytes
                })
                resolve(result)
              }
            }
          ).end(buffer)
        }) as any

        uploadedFiles.push({
          id: `cloudinary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          originalName: file.name,
          url: uploadResult.secure_url,
          preview: uploadResult.secure_url,
          type: isVideo ? 'video' : 'image',
          size: file.size,
          cloudinaryId: uploadResult.public_id,
          cloudinaryUrl: uploadResult.secure_url,
          isCloudinary: true
        })

      } catch (uploadError) {
        console.error('❌ [CLOUDINARY] Error uploading file:', file.name, uploadError)
        return NextResponse.json({
          error: `Error uploading ${file.name} to Cloudinary: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
        }, { status: 500 })
      }
    }

    console.log('🎉 [CLOUDINARY] All files uploaded successfully:', uploadedFiles.length)

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded to Cloudinary successfully`
    })

  } catch (error) {
    console.error('❌ [CLOUDINARY] General error:', error)
    return NextResponse.json({
      error: 'Failed to upload to Cloudinary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}