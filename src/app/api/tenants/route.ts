import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

function getUserId(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/session=([^;]+)/);
  if (!m) return "demo-user"; // Retornar demo-user si no hay auth

  try {
    const token = decodeURIComponent(m[1]);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    return payload.sub;
  } catch {
    return "demo-user"; // Fallback a demo-user
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    console.log("UserId en tenants:", userId);

    // En modo demo, retornar datos fijos
    const tenants = [
      {
        id: "1",
        name: "Cliente Demo",
        role: "admin"
      }
    ];

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Error en GET tenants:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
