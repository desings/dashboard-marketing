import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { isDatabaseAvailable } from '@/lib/database'

// Función para obtener userId del JWT  
function getUserId(req: Request): string {
  try {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/session=([^;]+)/);
    if (!match) return "user-1"; // Usuario temporal

    const token = decodeURIComponent(match[1]);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    return payload.sub;
  } catch {
    return "user-1"; // Usuario temporal
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    console.log("UserId en clientes:", userId);

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      try {
        const prisma = new PrismaClient();
        const clients = await prisma.userTenant.findMany({
          where: { userId },
          include: {
            tenant: {
              include: {
                socialAccounts: true
              }
            }
          }
        });

        const formattedClients = clients.map(relation => ({
          tenant: relation.tenant,
          socialAccounts: relation.tenant.socialAccounts
        }));

        await prisma.$disconnect();
        return NextResponse.json({ clients: formattedClients });
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos:', dbError);
      }
    }
    
    // Sin base de datos configurada - devolver vacío
    console.log('🔄 DATABASE_URL no configurada - Sistema requiere base de datos PostgreSQL');
    
    return NextResponse.json({ 
      clients: [],
      message: '⚠️ Configura DATABASE_URL para gestionar clientes reales'
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    console.log("POST clientes - userId:", userId, "body:", body);

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      try {
        const prisma = new PrismaClient();
        const newTenant = await prisma.tenant.create({
          data: {
            name: body.name,
            logoUrl: body.logoUrl || null
          }
        });

        // Crear relación usuario-tenant
        await prisma.userTenant.create({
          data: {
            userId,
            tenantId: newTenant.id,
            role: 'owner'
          }
        });

        await prisma.$disconnect();
        return NextResponse.json({ client: { tenant: newTenant, socialAccounts: [] } });
      } catch (dbError) {
        console.error('❌ Error creando cliente:', dbError);
        return NextResponse.json(
          { error: 'Error creando cliente en base de datos' },
          { status: 500 }
        );
      }
    }
    
    // Sin base de datos configurada - no permitir crear clientes
    return NextResponse.json({
      error: 'DATABASE_URL no configurada. Configure una base de datos PostgreSQL para gestionar clientes.',
      requiresSetup: true
    }, { status: 400 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT - Actualizar cliente existente
export async function PUT(req: Request) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    console.log("PUT clientes - userId:", userId, "body:", body);

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      try {
        const prisma = new PrismaClient();
        const updatedTenant = await prisma.tenant.update({
          where: { id: body.tenantId },
          data: {
            name: body.name,
            logoUrl: body.logoUrl
          }
        });

        await prisma.$disconnect();
        return NextResponse.json({ tenant: updatedTenant });
      } catch (dbError) {
        console.error('❌ Error actualizando cliente:', dbError);
        return NextResponse.json(
          { error: 'Error actualizando cliente en base de datos' },
          { status: 500 }
        );
      }
    }
    
    // Sin base de datos configurada - no permitir actualizar
    return NextResponse.json({
      error: 'DATABASE_URL no configurada. Configure una base de datos PostgreSQL para gestionar clientes.',
      requiresSetup: true
    }, { status: 400 });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE - Eliminar cliente
export async function DELETE(req: Request) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    console.log("DELETE clientes - userId:", userId, "body:", body);

    // Intentar usar base de datos real
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      try {
        const prisma = new PrismaClient();
        await prisma.tenant.delete({
          where: { id: body.tenantId }
        });

        await prisma.$disconnect();
        return NextResponse.json({ success: true });
      } catch (dbError) {
        console.error('❌ Error eliminando cliente:', dbError);
        return NextResponse.json(
          { error: 'Error eliminando cliente de base de datos' },
          { status: 500 }
        );
      }
    }
    
    // Sin base de datos configurada - no permitir eliminar
    return NextResponse.json({
      error: 'DATABASE_URL no configurada. Configure una base de datos PostgreSQL para gestionar clientes.',
      requiresSetup: true
    }, { status: 400 });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}