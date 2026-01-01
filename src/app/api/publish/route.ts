import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SocialMediaPublisher } from '../../../lib/social-publisher';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema de validación para publicar
const PublishSchema = z.object({
  tenantId: z.string(),
  content: z.string().min(1),
  socialAccountIds: z.array(z.string()).min(1),
  mediaUrls: z.array(z.string()).optional(),
  scheduledFor: z.string().optional(), // ISO string
  priority: z.number().min(1).max(3).optional().default(1)
});

// Función para obtener userId del JWT
function getUserId(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  try {
    const token = decodeURIComponent(match[1]);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

// POST - Publicar contenido ahora o programarlo
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = PublishSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: "Datos inválidos",
        details: validation.error.issues
      }, { status: 400 });
    }

    const { tenantId, content, socialAccountIds, mediaUrls, scheduledFor, priority } = validation.data;

    // Verificar acceso al tenant
    const access = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } }
    });

    if (!access) {
      return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
    }

    // Obtener cuentas sociales válidas
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        id: { in: socialAccountIds },
        tenantId,
        isActive: true
      }
    });

    if (socialAccounts.length === 0) {
      return NextResponse.json({ 
        error: "No se encontraron cuentas sociales válidas" 
      }, { status: 400 });
    }

    const publishResults: any[] = [];

    // Si es para publicar ahora
    if (!scheduledFor) {
      // Publicar inmediatamente en todas las cuentas
      for (const account of socialAccounts) {
        try {
          console.log(`[Publishing] Iniciando publicación en ${account.platform} para cuenta ${account.id}`);
          
          const result = await SocialMediaPublisher.publishToSinglePlatform(
            account.id,
            {
              text: content,
              media_urls: mediaUrls
            }
          );

          // Crear registro del post
          const scheduledPost = await prisma.scheduledPost.create({
            data: {
              tenantId,
              socialAccountId: account.id,
              content,
              mediaUrls: mediaUrls || [],
              scheduledFor: new Date(),
              publishedAt: result.success ? new Date() : null,
              status: result.success ? 'published' : 'failed',
              errorMessage: result.error || null,
              externalPostId: result.post_id || null,
              priority: priority || 1,
              createdBy: userId
            }
          });

          publishResults.push({
            platform: account.platform,
            username: account.username,
            success: result.success,
            error: result.error,
            postId: scheduledPost.id,
            externalPostId: result.post_id
          });

        } catch (error) {
          console.error(`[Publishing] Error en ${account.platform}:`, error);
          publishResults.push({
            platform: account.platform,
            username: account.username,
            success: false,
            error: (error as Error).message
          });
        }
      }

      const successCount = publishResults.filter(r => r.success).length;
      const totalCount = publishResults.length;

      return NextResponse.json({
        success: successCount > 0,
        message: `${successCount}/${totalCount} publicaciones completadas`,
        results: publishResults
      });

    } else {
      // Programar para más tarde
      const scheduledDateTime = new Date(scheduledFor);
      
      if (scheduledDateTime <= new Date()) {
        return NextResponse.json({ 
          error: "La fecha de programación debe ser en el futuro" 
        }, { status: 400 });
      }

      // Crear posts programados para cada cuenta
      const scheduledPosts = await Promise.all(
        socialAccounts.map(account => 
          prisma.scheduledPost.create({
            data: {
              tenantId,
              socialAccountId: account.id,
              content,
              mediaUrls: mediaUrls || [],
              scheduledFor: scheduledDateTime,
              status: 'scheduled',
              priority: priority || 1,
              createdBy: userId
            }
          })
        )
      );

      return NextResponse.json({
        success: true,
        message: `${scheduledPosts.length} posts programados para ${scheduledDateTime.toLocaleString()}`,
        scheduledPosts: scheduledPosts.map(post => ({
          id: post.id,
          platform: socialAccounts.find(acc => acc.id === post.socialAccountId)?.platform,
          scheduledFor: post.scheduledFor.toISOString()
        }))
      });
    }

  } catch (error) {
    console.error('[Publish API Error]', error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: (error as Error).message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Obtener posts programados
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!tenantId) {
      return NextResponse.json({ error: "ID del cliente requerido" }, { status: 400 });
    }

    // Verificar acceso al tenant
    const access = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } }
    });

    if (!access) {
      return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
    }

    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: whereClause,
      include: {
        socialAccount: {
          select: {
            platform: true,
            username: true,
            isConnected: true
          }
        }
      },
      orderBy: { scheduledFor: 'desc' },
      take: limit
    });

    return NextResponse.json({
      scheduledPosts: scheduledPosts.map(post => ({
        id: post.id,
        content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        platform: post.socialAccount?.platform,
        username: post.socialAccount?.username,
        scheduledFor: post.scheduledFor.toISOString(),
        publishedAt: post.publishedAt?.toISOString(),
        status: post.status,
        priority: post.priority,
        errorMessage: post.errorMessage,
        externalPostId: post.externalPostId,
        isConnected: post.socialAccount?.isConnected,
        createdAt: post.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('[Get Scheduled Posts Error]', error);
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}