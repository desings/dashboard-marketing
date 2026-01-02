import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Cloudinary configuration...')

    // Verificar variables de entorno
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    }

    console.log('📋 Environment variables:', {
      cloud_name: config.cloud_name ? '✅ Set' : '❌ Missing',
      api_key: config.api_key ? '✅ Set' : '❌ Missing',  
      api_secret: config.api_secret ? '✅ Set' : '❌ Missing',
    })

    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      return NextResponse.json({
        success: false,
        error: 'Missing Cloudinary configuration',
        config: {
          cloud_name: !!config.cloud_name,
          api_key: !!config.api_key,
          api_secret: !!config.api_secret,
        }
      }, { status: 500 })
    }

    // Configurar Cloudinary
    cloudinary.config(config)

    // Test básico - obtener información de la cuenta
    const result = await cloudinary.api.ping()
    
    console.log('✅ Cloudinary connection successful:', result)

    return NextResponse.json({
      success: true,
      message: 'Cloudinary configured successfully!',
      cloud_name: config.cloud_name,
      status: result.status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Cloudinary test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Cloudinary connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}