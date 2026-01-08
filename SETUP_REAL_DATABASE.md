# Configuración completa para funcionalidad real de InfoJobs

## 1. Base de datos PostgreSQL

### Opción A: Supabase (Recomendado - Gratis)
1. Ve a https://supabase.com
2. Crea cuenta gratuita
3. Crea nuevo proyecto
4. Ve a Settings > Database
5. Copia la CONNECTION STRING

### Opción B: Railway
1. Ve a https://railway.app  
2. Crea proyecto PostgreSQL
3. Copia la DATABASE_URL

### Opción C: Local con Docker
```bash
docker run --name dashboard-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

## 2. Variables de entorno para Vercel

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://[usuario]:[password]@[host]:[puerto]/[database]"

# Redis para BullMQ (opcional - para scraping automático)
REDIS_URL="redis://[host]:[puerto]"

# JWT y Next.js
JWT_SECRET="tu-jwt-secret-seguro"
NEXTAUTH_SECRET="tu-nextauth-secret"
```

## 3. Configurar en Vercel
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega las variables arriba

## 4. Ejecutar migración inicial
Una vez configurado, la app automáticamente:
- Creará todas las tablas necesarias
- Configurará usuario demo inicial
- Habilitará scraping real de InfoJobs

## ¿Qué quieres usar para la base de datos?