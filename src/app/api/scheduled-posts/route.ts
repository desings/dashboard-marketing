import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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

// Verificar que el usuario tiene acceso al tenant
async function verifyTenantAccess(userId: string, tenantId: string) {
  const access = await prisma.userTenant.findUnique({
    where: { userId_tenantId: { userId, tenantId } }
  });
  return !!access;
}

// GET - Obtener posts programados
export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    
    if (!tenantId) {
      return NextResponse.json({ error: "ID del cliente es requerido" }, { status: 400 });
    }

    // Verificar acceso al tenant
    const hasAccess = await verifyTenantAccess(userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
    }

    const posts = await prisma.scheduledPost.findMany({
      where: { tenantId },
      include: {
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true
          }
        }
      },
      orderBy: { scheduledFor: "desc" }
    });

    return NextResponse.json({
      posts: posts.map(post => ({
        id: post.id,
        content: post.content,
        mediaUrls: post.mediaUrls,
        scheduledFor: post.scheduledFor.toISOString(),
        status: post.status,
        socialAccount: post.socialAccount ? {
          platform: post.socialAccount.platform,
          username: post.socialAccount.username
        } : null,
        createdAt: post.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST - Crear nuevo post programado
export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { tenantId, content, scheduledFor, socialAccountIds } = await req.json();
    
    if (!tenantId || !content || !scheduledFor || !socialAccountIds || socialAccountIds.length === 0) {
      return NextResponse.json({ 
        error: "Todos los campos son requeridos (tenantId, content, scheduledFor, socialAccountIds)" 
      }, { status: 400 });
    }

    // Verificar acceso al tenant
    const hasAccess = await verifyTenantAccess(userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
    }

    // Validar que la fecha no sea en el pasado
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: "La fecha programada debe ser futura" }, { status: 400 });
    }

    // Verificar que las social accounts pertenecen al tenant
    const validAccounts = await prisma.socialAccount.findMany({
      where: {
        id: { in: socialAccountIds },
        tenantId: tenantId
      }
    });

    if (validAccounts.length !== socialAccountIds.length) {
      return NextResponse.json({ error: "Algunas cuentas sociales no son válidas" }, { status: 400 });
    }

    // Crear posts programados para cada cuenta social
    const createdPosts = await Promise.all(
      socialAccountIds.map(async (socialAccountId: string) => {
        return prisma.scheduledPost.create({
          data: {
            tenantId,
            socialAccountId,
            content,
            scheduledFor: scheduledDate,
            status: "scheduled",
            createdBy: userId
          }
        });
      })
    );

    return NextResponse.json({ 
      success: true, 
      postsCreated: createdPosts.length,
      posts: createdPosts.map(post => ({
        id: post.id,
        scheduledFor: post.scheduledFor.toISOString(),
        status: post.status
      }))
    });
  } catch (error) {
    console.error("Error creating scheduled post:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT - Actualizar post programado
export async function PUT(req: Request) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { postId, content, scheduledFor, status } = await req.json();
    
    if (!postId) {
      return NextResponse.json({ error: "ID del post es requerido" }, { status: 400 });
    }

    // Verificar que el post existe y el usuario tiene acceso
    const existingPost = await prisma.scheduledPost.findFirst({
      where: {
        id: postId,
        tenant: {
          users: {
            some: { userId }
          }
        }
      }
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post no encontrado o sin acceso" }, { status: 404 });
    }

    // No permitir editar posts ya publicados
    if (existingPost.status === "published") {
      return NextResponse.json({ error: "No se pueden editar posts ya publicados" }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (content !== undefined) updateData.content = content;
    if (scheduledFor !== undefined) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return NextResponse.json({ error: "La fecha programada debe ser futura" }, { status: 400 });
      }
      updateData.scheduledFor = scheduledDate;
    }
    if (status !== undefined) updateData.status = status;

    const updatedPost = await prisma.scheduledPost.update({
      where: { id: postId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        content: updatedPost.content,
        scheduledFor: updatedPost.scheduledFor.toISOString(),
        status: updatedPost.status
      }
    });
  } catch (error) {
    console.error("Error updating scheduled post:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE - Eliminar post programado
export async function DELETE(req: Request) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { postId } = await req.json();
    
    if (!postId) {
      return NextResponse.json({ error: "ID del post es requerido" }, { status: 400 });
    }

    // Verificar que el post existe y el usuario tiene acceso
    const existingPost = await prisma.scheduledPost.findFirst({
      where: {
        id: postId,
        tenant: {
          users: {
            some: { userId }
          }
        }
      }
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post no encontrado o sin acceso" }, { status: 404 });
    }

    // Solo permitir eliminar posts en draft o scheduled
    if (["published", "publishing"].includes(existingPost.status)) {
      return NextResponse.json({ 
        error: "No se pueden eliminar posts publicados o en proceso de publicación" 
      }, { status: 400 });
    }

    await prisma.scheduledPost.delete({
      where: { id: postId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled post:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}