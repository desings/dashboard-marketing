import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: []
  },
  // Configuración para manejo de archivos
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
  // Configuración para archivos estáticos
  images: {
    domains: ['localhost'],
    unoptimized: true
  }
};

export default nextConfig;
