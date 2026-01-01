import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONNECTED_ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'connected-accounts.json')

// Load connected accounts from file (fallback for OAuth tokens)
function loadConnectedAccounts(): any[] {
  try {
    if (fs.existsSync(CONNECTED_ACCOUNTS_FILE)) {
      const data = fs.readFileSync(CONNECTED_ACCOUNTS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading connected accounts:', error)
  }
  return []
}

export async function POST(request: NextRequest) {
  try {
    const { content, platforms, media } = await request.json()
    
    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Contenido y plataformas son requeridos' 
      }, { status: 400 })
    }

    const results: any = {}
    const connectedAccounts = loadConnectedAccounts()

    for (const platform of platforms) {
      console.log(`📤 [SCHEDULER] Publicando en ${platform}: ${content.substring(0, 50)}...`)
      
      if (platform === 'facebook') {
        // Usar OAuth para Facebook
        const fbAccount = connectedAccounts.find((acc: any) => acc.provider === 'facebook')
        
        if (!fbAccount?.pageToken) {
          results[platform] = {
            success: false,
            error: 'Facebook no está conectado via OAuth'
          }
          continue
        }
        
        try {
          const publishUrl = fbAccount.pageId 
            ? `https://graph.facebook.com/v19.0/${fbAccount.pageId}/feed`
            : `https://graph.facebook.com/v19.0/me/feed`

          const publishResponse = await fetch(publishUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              message: content,
              access_token: fbAccount.pageToken
            })
          })

          const publishData = await publishResponse.json()

          if (!publishResponse.ok || publishData.error) {
            results[platform] = {
              success: false,
              error: `Facebook API error: ${publishData.error?.message || 'Unknown error'}`
            }
          } else {
            results[platform] = {
              success: true,
              postId: publishData.id,
              postUrl: `https://facebook.com/${publishData.id}`
            }
          }
        } catch (error) {
          results[platform] = {
            success: false,
            error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}`
          }
        }
      } else {
        // Para otras plataformas, usar el endpoint existente
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/publish-real`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: platform,
              content: content,
              publishNow: true,
              media: media
            })
          })

          const result = await response.json()
          results[platform] = result
        } catch (error) {
          results[platform] = {
            success: false,
            error: `Error calling publish-real: ${error instanceof Error ? error.message : 'Unknown'}`
          }
        }
      }
    }

    // Check if all platforms succeeded
    const allSuccessful = Object.values(results).every((result: any) => result.success)

    return NextResponse.json({
      success: allSuccessful,
      results: results,
      message: allSuccessful ? 'Todas las publicaciones exitosas' : 'Algunas publicaciones fallaron'
    })

  } catch (error) {
    console.error('Error in scheduled publish:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}