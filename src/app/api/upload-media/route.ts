import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadedFiles = []
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'media')

    // Asegurar que existe el directorio
    try {
      await fs.mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directorio ya existe
    }

    for (const file of files) {
      if (file.size === 0) continue
      
      // Generar nombre único
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = path.join(uploadsDir, fileName)
      
      // Escribir archivo
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await fs.writeFile(filePath, buffer)
      
      uploadedFiles.push({
        id: `media_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        originalName: file.name,
        url: `/uploads/media/${fileName}`,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size
      })
    }

    console.log('📁 [UPLOAD] Files uploaded:', uploadedFiles.map(f => f.fileName))

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    })

  } catch (error) {
    console.error('❌ [UPLOAD] Error uploading files:', error)
    return NextResponse.json(
      { error: 'Error uploading files' },
      { status: 500 }
    )
  }
}