import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Generating Cloudinary signature for direct upload...')

    // Verificar configuración
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({
        error: 'Cloudinary not configured'
      }, { status: 500 })
    }

    const { timestamp, upload_preset, public_id, folder } = await request.json()

    // Generar firma para upload directo
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp || Math.round(new Date().getTime() / 1000),
        upload_preset: upload_preset || undefined,
        public_id: public_id || undefined,
        folder: folder || 'dashboard-marketing'
      },
      process.env.CLOUDINARY_API_SECRET
    )

    console.log('✅ Signature generated successfully')

    return NextResponse.json({
      success: true,
      signature,
      timestamp: timestamp || Math.round(new Date().getTime() / 1000),
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      folder: folder || 'dashboard-marketing'
    })

  } catch (error) {
    console.error('❌ Error generating signature:', error)
    return NextResponse.json({
      error: 'Failed to generate upload signature',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}