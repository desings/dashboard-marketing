import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST() {
  const email = process.env.ADMIN_EMAIL || "admin@local.com";
  const password = process.env.ADMIN_PASSWORD || "Admin12345!";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    update: { name: "Cliente Demo" },
    create: { id: "demo-tenant", name: "Cliente Demo" },
  });

  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: {},
    create: { userId: user.id, tenantId: tenant.id, role: "owner" },
  });

  return Response.json({
    ok: true,
    email,
    tenant: { id: tenant.id, name: tenant.name },
  });
}
