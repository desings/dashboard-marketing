import { NextResponse } from 'next/server'
import { isDatabaseAvailable } from '@/lib/database'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('📊 DATABASE_URL present:', !!process.env.DATABASE_URL)
    console.log('📊 DATABASE_URL length:', process.env.DATABASE_URL?.length)
    
    const isAvailable = await isDatabaseAvailable()
    
    return NextResponse.json({
      success: true,
      databaseAvailable: isAvailable,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      urlLength: process.env.DATABASE_URL?.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasDatabaseUrl: !!process.env.DATABASE_URL
    })
  }
}