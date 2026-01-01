import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, content, message, platform, platforms } = await req.json();
    
    const postContent = content || message;
    const postPlatforms = platforms || (platform ? [platform] : ['facebook']);
    const defaultTenantId = tenantId || 'demo-tenant';
    
    console.log('🧪 [TEST MODE] Simulating post publication:', {
      tenantId: defaultTenantId,
      platforms: postPlatforms,
      contentLength: postContent?.length || 0
    });

    if (!postContent || postPlatforms.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: content/message y platform/platforms' },
        { status: 400 }
      );
    }

    const results: any = {};
    
    // Simulate publishing for each platform
    for (const platformName of postPlatforms) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      
      const fakePostId = Math.random().toString(36).substr(2, 12);
      
      console.log(`✅ [${platformName.toUpperCase()}] Simulated post: ${fakePostId}`);
      
      results[platformName] = {
        status: 'published_simulation',
        postId: fakePostId,
        platform: platformName,
        content: postContent,
        publishedAt: new Date().toISOString(),
        simulation_note: 'Esta es una publicación simulada para pruebas. En modo real se publicaría en la red social.',
        url: `https://${platformName}.com/posts/${fakePostId}` // Fake URL for demo
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Publicación simulada completada exitosamente',
      mode: 'TEST_SIMULATION',
      tenantId: defaultTenantId,
      platforms: postPlatforms,
      results,
      publishedAt: new Date().toISOString(),
      note: '⚠️ Esta fue una publicación simulada. Para publicaciones reales, configura los permisos de Facebook correctamente.'
    });

  } catch (error) {
    console.error('❌ [TEST MODE] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error en modo de prueba',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de publicación en modo de prueba',
    description: 'Este endpoint simula publicaciones sin publicar realmente en las redes sociales',
    usage: 'POST con { "content": "mensaje", "platform": "facebook" }',
    platforms_supported: ['facebook', 'instagram', 'twitter', 'linkedin']
  });
}