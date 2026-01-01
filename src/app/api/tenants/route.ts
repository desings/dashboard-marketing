import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

function getUserId(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/session=([^;]+)/);
  if (!m) return null;

  try {
    const token = decodeURIComponent(m[1]);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rows = await prisma.userTenant.findMany({
    where: { userId },
    include: { tenant: true },
    orderBy: { tenantId: "asc" },
  });

  return NextResponse.json({
    tenants: rows.map((r) => ({ id: r.tenant.id, name: r.tenant.name, role: r.role })),
  });
}
