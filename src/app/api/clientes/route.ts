import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Función para obtener userId del JWT
function getUserId(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return "demo-user"; // Retornar demo-user si no hay auth

  try {
    const token = decodeURIComponent(match[1]);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    return payload.sub;
  } catch {
    return "demo-user"; // Fallback a demo-user
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    console.log("UserId en clientes:", userId);

    // Obtener clientes desde base de datos real
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

    return NextResponse.json({ clients: formattedClients });
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

    // Crear cliente en base de datos real
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

    return NextResponse.json({ client: { tenant: newTenant, socialAccounts: [] } });
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

    // En modo demo, simular actualización exitosa
    const updatedClient = {
      tenant: {
        id: body.tenantId || "1",
        name: body.name || "Cliente Actualizado",
        logoUrl: body.logoUrl || null,
        createdAt: new Date().toISOString()
      }
    };

    return NextResponse.json({ tenant: updatedClient.tenant });
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

    // En modo demo, simular eliminación exitosa
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}