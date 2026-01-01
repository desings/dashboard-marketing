import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";

// Función para obtener userId del JWT
function getUserId(req: NextRequest) {
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

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tenantId = formData.get("tenantId") as string;

    if (!file) {
      return NextResponse.json({ error: "No se seleccionó archivo" }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "ID del cliente es requerido" }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Tipo de archivo no válido. Solo se permiten: JPG, PNG, WebP" 
      }, { status: 400 });
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "El archivo es demasiado grande. Máximo 5MB" 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `logo_${tenantId}_${timestamp}.${extension}`;
    
    // Crear directorio si no existe
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(uploadsDir, { recursive: true });

    // Guardar archivo
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    // URL pública del archivo
    const logoUrl = `/uploads/logos/${filename}`;

    return NextResponse.json({
      success: true,
      logoUrl,
      filename
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}