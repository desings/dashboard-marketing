import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple file-based storage for scheduled posts
const SCHEDULED_POSTS_FILE = path.join(process.cwd(), 'data', 'scheduled-posts.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(SCHEDULED_POSTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load scheduled posts from file
function loadScheduledPosts(): any[] {
  ensureDataDir();
  try {
    if (fs.existsSync(SCHEDULED_POSTS_FILE)) {
      const data = fs.readFileSync(SCHEDULED_POSTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading scheduled posts:', error);
  }
  return [];
}

// Save scheduled posts to file
function saveScheduledPosts(posts: any[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(SCHEDULED_POSTS_FILE, JSON.stringify(posts, null, 2));
  } catch (error) {
    console.error('Error saving scheduled posts:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, content, message, platform, platforms, scheduledFor, publishNow = false, media } = await req.json();
    
    // Use message or content (flexible input)
    const postContent = content || message;
    const postPlatforms = platforms || (platform ? [platform] : ['facebook']);
    const defaultTenantId = tenantId || 'demo-tenant';
    const mediaFiles = media || [];
    
    // Check if this is a scheduled post
    const isScheduled = scheduledFor && !publishNow;
    const scheduleDate = scheduledFor ? new Date(scheduledFor) : null;
    const isValidSchedule = scheduleDate && scheduleDate > new Date();

    console.log('📤 [HYBRID PUBLISH] Publishing with OAuth2 fallback:', {
      tenantId: defaultTenantId,
      platforms: postPlatforms,
      publishNow,
      isScheduled,
      scheduledFor,
      isValidSchedule,
      contentLength: postContent?.length || 0,
      mediaCount: mediaFiles.length
    });

    // Validations
    if (!postContent || postPlatforms.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: content/message y platform/platforms' },
        { status: 400 }
      );
    }

    // If scheduled for future, store it instead of publishing
    if (isScheduled && isValidSchedule) {
      console.log('📅 [HYBRID] Programando post para:', scheduleDate.toISOString());
      
      // Store scheduled post in file
      const scheduledPost = {
        id: Date.now().toString(),
        content: postContent,
        platforms: postPlatforms,
        media: mediaFiles,
        tenantId: defaultTenantId,
        scheduledFor: scheduleDate.toISOString(),
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };

      // Save to scheduled posts file
      const allPosts = loadScheduledPosts();
      allPosts.push(scheduledPost);
      saveScheduledPosts(allPosts);
      return NextResponse.json({
        success: true,
        message: 'Post programado exitosamente',
        scheduled: true,
        scheduledFor: scheduleDate.toISOString(),
        postId: scheduledPost.id,
        results: postPlatforms.reduce((acc: any, platform: any) => {
          acc[platform] = {
            success: true,
            platform,
            status: 'scheduled',
            scheduledFor: scheduleDate.toISOString(),
            message: `Programado para ${scheduleDate.toLocaleString('es-ES')}`
          };
          return acc;
        }, {} as any)
      });
    }

    // If scheduled for past or publishNow=true, proceed with immediate publishing
    if (isScheduled && !isValidSchedule) {
      console.log('⚠️ [HYBRID] Fecha programada inválida o en el pasado, publicando inmediatamente');
    }

    const results: any = {};
    
    // Process each platform
    for (const platformName of postPlatforms) {
      if (platformName === 'facebook') {
        try {
          console.log('📤 [HYBRID] Intentando publicar vía n8n webhook...');
          
          // Step 1: Try n8n OAuth2 webhook first  
          const n8nWebhookUrl = `${process.env.N8N_BASE_URL}/webhook/facebook-token-direct`;
          
          const n8nPayload = {
            text: postContent,
            message: postContent,
            content: { text: postContent },
            tenantId: defaultTenantId,
            platform: 'facebook',
            publishNow,
            media: mediaFiles,
            timestamp: new Date().toISOString()
          };

          try {
            const n8nResponse = await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': process.env.N8N_AUTH_TOKEN || ''
              },
              body: JSON.stringify(n8nPayload),
              signal: AbortSignal.timeout(15000) // 15 seconds
            });

            if (n8nResponse.ok) {
              // n8n webhook executed successfully (status 200)
              let n8nResult;
              try {
                const responseText = await n8nResponse.text();
                n8nResult = responseText ? JSON.parse(responseText) : {};
              } catch (parseError) {
                // If response is not JSON or empty, still consider success
                console.log('📝 [HYBRID] n8n response not JSON, but status OK:', n8nResponse.status);
                n8nResult = { success: true };
              }
              
              console.log('✅ [HYBRID] Success via n8n webhook OAuth2');
              
              results.facebook = {
                success: true,
                platform: 'facebook',
                postId: n8nResult.postId || 'published_oauth2',
                message: 'Publicado exitosamente vía n8n (OAuth2)',
                method: 'n8n_webhook_oauth2',
                publishedAt: new Date().toISOString()
              };
              continue; // Success, skip fallback
            } else {
              const errorText = await n8nResponse.text();
              console.log('⚠️ [HYBRID] n8n webhook failed, trying fallback:', errorText);
            }
          } catch (webhookError) {
            console.log('⚠️ [HYBRID] n8n webhook error, trying fallback:', webhookError);
          }

          // Step 2: Fallback to direct Facebook API if n8n webhook fails
          console.log('🔄 [HYBRID] Fallback: using direct Facebook API...');
          
          const directResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/publish-real`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              platform: 'facebook',
              content: postContent,
              tenantId: defaultTenantId,
              publishNow,
              media: mediaFiles
            })
          });

          if (directResponse.ok) {
            const directResult = await directResponse.json();
            console.log('✅ [HYBRID] Success via direct API:', directResult);
            
            results.facebook = {
              success: true,
              platform: 'facebook',
              postId: directResult.results?.facebook?.postId || 'published',
              message: 'Publicado exitosamente vía API directa (fallback)',
              method: 'direct_api_fallback',
              publishedAt: new Date().toISOString()
            };
          } else {
            const directError = await directResponse.json();
            console.error('❌ [HYBRID] Both methods failed:', directError);
            
            results.facebook = {
              success: false,
              platform: 'facebook',
              error: `Ambos métodos fallaron. n8n: webhook no disponible, API directa: ${directError.error}`,
              solution: {
                type: 'oauth_setup_needed',
                message: 'Activa el workflow en n8n: https://vmi2907616.contaboserver.net'
              }
            };
          }

        } catch (error) {
          console.error('❌ [HYBRID] Unexpected error:', error);
          
          results.facebook = {
            success: false,
            platform: 'facebook',
            error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            solution: {
              type: 'system_error',
              message: 'Contacta al administrador del sistema'
            }
          };
        }
      }
    }

    // Check if any platform succeeded
    const hasSuccess = Object.values(results).some((result: any) => result.success);
    const hasFailure = Object.values(results).some((result: any) => !result.success);

    console.log('📊 [HYBRID] Final results:', { hasSuccess, hasFailure, results });

    if (hasSuccess && !hasFailure) {
      return NextResponse.json({
        success: true,
        message: 'Post publicado exitosamente',
        results,
        publishedAt: new Date().toISOString()
      });
    } else if (hasSuccess && hasFailure) {
      return NextResponse.json({
        success: false,
        message: 'Publicación parcialmente exitosa',
        results,
        publishedAt: new Date().toISOString()
      }, { status: 207 });
    } else {
      // All failed
      const firstError = Object.values(results)[0] as any;
      return NextResponse.json({
        success: false,
        error: firstError?.error || 'Error en todas las plataformas',
        results,
        publishedAt: new Date().toISOString()
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [HYBRID] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}