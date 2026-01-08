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

// GET - Obtener todos los clientes con sus cuentas sociales
export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    console.log("UserId en clientes:", userId);

    // En modo demo, retornar datos fijos
    const clients = [
      {
        tenant: {
          id: "1",
          name: "Cliente Demo",
          logoUrl: null,
          createdAt: new Date().toISOString()
        },
        socialAccounts: [
          {
            id: "1",
            platform: "facebook",
            username: "demo_facebook",
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: "2", 
            platform: "linkedin",
            username: "demo_linkedin",
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ]
      }
    ];

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST - Crear nuevo cliente
export async function POST(req: Request) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    console.log("POST clientes - userId:", userId, "body:", body);

    // En modo demo, simular creación exitosa
    const newClient = {
      tenant: {
        id: Date.now().toString(),
        name: body.name || "Nuevo Cliente",
        logoUrl: null,
        createdAt: new Date().toISOString()
      },
      socialAccounts: []
    };

    return NextResponse.json({ client: newClient });
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