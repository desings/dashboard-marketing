import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para archivos estáticos
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'dashboard-marketing-a62m.vercel.app',
        pathname: '/uploads/**',
      }
    ],
    unoptimized: true
  }
};

export default nextConfig;
