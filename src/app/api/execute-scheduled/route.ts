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

// Function to publish a single post
async function publishPost(post: any) {
  try {
    console.log('📤 [SCHEDULER] Publicando post programado:', post.id);
    
    const publishResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/publish-scheduled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: post.content,
        platforms: post.platforms,
        media: post.media
      })
    });

    if (publishResponse.ok) {
      const result = await publishResponse.json();
      console.log('✅ [SCHEDULER] Post publicado exitosamente:', post.id);
      return {
        success: true,
        postId: post.id,
        publishResult: result,
        publishedAt: new Date().toISOString()
      };
    } else {
      const error = await publishResponse.json();
      console.error('❌ [SCHEDULER] Error publicando post:', post.id, error);
      return {
        success: false,
        postId: post.id,
        error: error.error || 'Error desconocido',
        attemptedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('❌ [SCHEDULER] Error ejecutando post:', post.id, error);
    return {
      success: false,
      postId: post.id,
      error: error instanceof Error ? error.message : 'Error de conexión',
      attemptedAt: new Date().toISOString()
    };
  }
}

// POST - Execute scheduled posts that are due
export async function POST(req: NextRequest) {
  try {
    console.log('🕒 [SCHEDULER] Verificando posts programados...');
    
    const allPosts = loadScheduledPosts();
    const now = new Date();
    const currentTime = now.toISOString();
    
    // Find posts that are due (scheduled time has passed and status is still 'scheduled')
    const duePostsIndexes: number[] = [];
    const duePosts = allPosts.filter((post, index) => {
      const scheduledTime = new Date(post.scheduledFor);
      const isDue = scheduledTime <= now && post.status === 'scheduled';
      if (isDue) {
        duePostsIndexes.push(index);
      }
      return isDue;
    });
    
    console.log(`📋 [SCHEDULER] Encontrados ${duePosts.length} posts para publicar`);
    
    if (duePosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay posts programados para publicar en este momento',
        checkedAt: currentTime,
        postsExecuted: 0,
        scheduledPostsTotal: allPosts.filter(p => p.status === 'scheduled').length
      });
    }
    
    const results: any[] = [];
    
    // Execute each due post
    for (let i = 0; i < duePosts.length; i++) {
      const post = duePosts[i];
      const postIndex = duePostsIndexes[i];
      
      console.log(`📤 [SCHEDULER] Ejecutando post ${i + 1}/${duePosts.length}: ${post.id}`);
      
      const publishResult = await publishPost(post);
      results.push(publishResult);
      
      // Update post status based on result
      if (publishResult.success) {
        allPosts[postIndex] = {
          ...post,
          status: 'published',
          publishedAt: publishResult.publishedAt,
          publishResult: publishResult.publishResult
        };
      } else {
        allPosts[postIndex] = {
          ...post,
          status: 'failed',
          failedAt: publishResult.attemptedAt,
          error: publishResult.error
        };
      }
    }
    
    // Save updated posts
    saveScheduledPosts(allPosts);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    console.log(`✅ [SCHEDULER] Completado: ${successCount} exitosos, ${failedCount} fallaron`);
    
    return NextResponse.json({
      success: true,
      message: `Ejecutados ${duePosts.length} posts programados`,
      executedAt: currentTime,
      results: {
        total: duePosts.length,
        successful: successCount,
        failed: failedCount,
        details: results
      }
    });
    
  } catch (error) {
    console.error('❌ [SCHEDULER] Error general:', error);
    return NextResponse.json(
      { 
        error: 'Error ejecutando posts programados',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET - Check scheduled posts status
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') || 'demo-tenant';
    
    const allPosts = loadScheduledPosts();
    const tenantPosts = allPosts.filter(post => post.tenantId === tenantId);
    const now = new Date();
    
    const scheduled = tenantPosts.filter(p => p.status === 'scheduled');
    const published = tenantPosts.filter(p => p.status === 'published');
    const failed = tenantPosts.filter(p => p.status === 'failed');
    const due = scheduled.filter(p => new Date(p.scheduledFor) <= now);
    
    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      tenantId,
      summary: {
        total: tenantPosts.length,
        scheduled: scheduled.length,
        published: published.length,
        failed: failed.length,
        due: due.length
      },
      posts: {
        scheduled,
        published: published.slice(-10), // Last 10 published
        failed,
        due
      }
    });
  } catch (error) {
    console.error('Error checking scheduled posts:', error);
    return NextResponse.json(
      { error: 'Error checking scheduled posts' },
      { status: 500 }
    );
  }
}