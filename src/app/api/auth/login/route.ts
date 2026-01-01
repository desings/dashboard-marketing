import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
