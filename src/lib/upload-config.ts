import { NextRequest } from 'next/server'

// Configuración para el tamaño máximo de archivos
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
}

// Función helper para validar límites de archivo
export const validateFileSize = (size: number): boolean => {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  return size <= MAX_SIZE;
}

export const getContentLength = (req: NextRequest): number => {
  const contentLength = req.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : 0;
}