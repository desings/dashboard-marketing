import { NextRequest, NextResponse } from 'next/server'

interface ScheduledPost {
  id: string
  content: string
  date: string
  time: string
  platforms: string[]
  type: 'post' | 'story'
  media?: any[]
  status: 'pending' | 'published' | 'failed'
  facebookPostId?: string
  createdAt: string
  updatedAt: string
}

// En una aplicación real, esto estaría en una base de datos
// Por ahora usaremos archivos para persistencia
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'programming-posts.json')

async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE)
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch (error) {
    // Directorio ya existe
  }
}

async function loadPosts(): Promise<ScheduledPost[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Archivo no existe, devolver datos por defecto
    return [
      {
        id: '1',
        content: 'Bienvenidos a nuestra nueva temporada de productos!',
        date: '2025-01-15',
        time: '09:00',
        platforms: ['facebook', 'instagram'],
        type: 'post',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2', 
        content: 'No te pierdas nuestras ofertas especiales.',
        date: '2025-01-15',
        time: '14:30',
        platforms: ['facebook'],
        type: 'story',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        content: 'Nueva colección disponible ahora! 🎉',
        date: '2025-12-26',
        time: '10:00',
        platforms: ['facebook', 'twitter'],
        type: 'post',
        status: 'published',
        facebookPostId: '416378634882633_122176225838452315',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
}

async function savePosts(posts: ScheduledPost[]) {
  await ensureDataDir()
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2))
}

// GET - Obtener todas las publicaciones
export async function GET() {
  try {
    const posts = await loadPosts()
    return NextResponse.json({ success: true, posts })
  } catch (error) {
    console.error('❌ [PROGRAMMING POSTS] Error loading posts:', error)
    return NextResponse.json({ error: 'Error loading posts' }, { status: 500 })
  }
}

// POST - Crear nueva publicación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, date, time, platforms, type, media } = body

    const posts = await loadPosts()
    
    const newPost: ScheduledPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      date,
      time,
      platforms,
      type: type || 'post',
      media: media || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    posts.push(newPost)
    await savePosts(posts)

    console.log('✅ [PROGRAMMING POSTS] Created:', newPost.id)
    return NextResponse.json({ success: true, post: newPost })

  } catch (error) {
    console.error('❌ [PROGRAMMING POSTS] Error creating post:', error)
    return NextResponse.json({ error: 'Error creating post' }, { status: 500 })
  }
}

// PUT - Actualizar publicación
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, content, date, time, platforms, type, status, facebookPostId } = body

    const posts = await loadPosts()
    const postIndex = posts.findIndex(p => p.id === id)
    
    if (postIndex === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    posts[postIndex] = {
      ...posts[postIndex],
      content: content || posts[postIndex].content,
      date: date || posts[postIndex].date,
      time: time || posts[postIndex].time,
      platforms: platforms || posts[postIndex].platforms,
      type: type || posts[postIndex].type,
      status: status || posts[postIndex].status,
      facebookPostId: facebookPostId || posts[postIndex].facebookPostId,
      updatedAt: new Date().toISOString()
    }

    await savePosts(posts)

    console.log('✅ [PROGRAMMING POSTS] Updated:', id)
    return NextResponse.json({ success: true, post: posts[postIndex] })

  } catch (error) {
    console.error('❌ [PROGRAMMING POSTS] Error updating post:', error)
    return NextResponse.json({ error: 'Error updating post' }, { status: 500 })
  }
}

// DELETE - Eliminar publicación
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    const posts = await loadPosts()
    const filteredPosts = posts.filter(p => p.id !== id)
    
    if (posts.length === filteredPosts.length) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    await savePosts(filteredPosts)

    console.log('✅ [PROGRAMMING POSTS] Deleted:', id)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ [PROGRAMMING POSTS] Error deleting post:', error)
    return NextResponse.json({ error: 'Error deleting post' }, { status: 500 })
  }
}