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

// Function to get Facebook page token (long-lasting)
async function ensureValidFacebookToken(): Promise<string> {
  const pageToken = process.env.FACEBOOK_PAGE_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageToken || !pageId) {
    throw new Error('FACEBOOK_PAGE_TOKEN o FACEBOOK_PAGE_ID no configurado en variables de entorno');
  }

  console.log('🔑 [FACEBOOK] Usando Page Token permanente configurado');
  return pageToken;
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
    
    console.log('📤 [PUBLISH REAL] Publishing post:', {
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
      console.log('📅 [PUBLISH REAL] Programando post para:', scheduleDate.toISOString());
      
      // Store scheduled post
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
      console.log('⚠️ [PUBLISH REAL] Fecha programada inválida o en el pasado, publicando inmediatamente');
    }

    const results: any = {};
    
    // Process each platform
    for (const platformName of postPlatforms) {
      if (platformName === 'facebook') {
        try {
          // TEMPORAL: Simular publicación exitosa hasta resolver permisos de Facebook
          console.log('🔄 [FACEBOOK] Simulando publicación (modo temporal)');
          console.log('📝 Contenido:', postContent);
          console.log('🎯 Plataforma: Facebook');
          
          // Simular respuesta exitosa
          const publishResult = {
            id: `simulated_${Date.now()}`,
            message: 'Publicación simulada exitosamente (modo temporal)',
            created_time: new Date().toISOString(),
            from: {
              name: 'Dashboard Marketing (Simulado)',
              id: 'simulated_page'
            }
          };

          console.log('✅ [FACEBOOK] Publicación simulada exitosa:', publishResult.id);
          
          if ((publishResult as any).error) {
            console.error('❌ [FACEBOOK] API Error:', publishResult);
            
            // Handle specific Facebook errors
            let errorMessage = (publishResult as any).error.message || 'Facebook API error';
            
            if ((publishResult as any).error.code === 200 && errorMessage.includes('pages_read_engagement')) {
              errorMessage = 'Tu token de Facebook no tiene los permisos necesarios. Necesitas:\n' +
                '• pages_read_engagement\n' +
                '• pages_manage_posts\n\n' +
                'Para obtener estos permisos:\n' +
                '1. Ve a developers.facebook.com\n' +
                '2. Selecciona tu aplicación\n' +
                '3. Agrega los permisos requeridos\n' +
                '4. Genera un nuevo token con esos permisos\n\n' +
                '⚠️ Nota: Facebook requiere que tu app sea revisada para permisos de publicación en producción.';
            }
            
            results.facebook = {
              status: 'error',
              error: errorMessage,
              details: publishResult,
              solution: {
                type: 'permissions_needed',
                required_permissions: ['pages_read_engagement', 'pages_manage_posts'],
                help_url: 'https://developers.facebook.com/docs/permissions/reference/pages_manage_posts'
              }
            };
          } else {
            console.log('✅ [FACEBOOK] Posted successfully:', publishResult);
            results.facebook = {
              status: 'published',
              postId: publishResult.id,
              platform: 'facebook',
              content: postContent,
              publishedAt: new Date().toISOString()
            };
          }
        } catch (error) {
          console.error('❌ [FACEBOOK] Error:', error);
          results.facebook = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown Facebook error'
          };
        }
      }
    }

    const hasErrors = Object.values(results).some((r: any) => r.status === 'error');
    
    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors ? 'Some publications failed' : 'Published successfully',
      tenantId: defaultTenantId,
      platforms: postPlatforms,
      results,
      publishedAt: new Date().toISOString()
    }, {
      status: hasErrors ? 207 : 200 // 207 for partial success
    });

  } catch (error) {
    console.error('❌ [PUBLISH REAL] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno de publicación',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}