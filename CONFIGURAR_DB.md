# 🗄️ Configuración de Base de Datos

## Estado Actual
✅ Todos los datos de demostración eliminados
❌ DATABASE_URL no configurada
⚠️ Sistema requiere PostgreSQL para funcionar

## Opciones Rápidas

### 1. Vercel Postgres (Recomendado)
```bash
# En tu dashboard de Vercel:
# 1. Storage → Create Database → Postgres
# 2. Copia la DATABASE_URL
# 3. Environment Variables → Add DATABASE_URL
```

### 2. Supabase (Gratis)
```bash
# 1. Crear cuenta en supabase.com
# 2. New project
# 3. Settings → Database → Connection string
# 4. Agregar a Vercel como DATABASE_URL
```

### 3. Local Development
```bash
# Docker local
docker run --name postgres-dev -p 5432:5432 -e POSTGRES_PASSWORD=dev123 -d postgres:15

# .env.local
DATABASE_URL="postgresql://postgres:dev123@localhost:5432/postgres"
```

## Activar Sistema Real

Una vez configurada DATABASE_URL:

```bash
# Migrar esquema
npx prisma migrate deploy

# Verificar conexión
npx prisma studio
```

## Funcionalidades que se Activarán

✅ Scraping real de InfoJobs con tu URL exacta
✅ Almacenamiento persistente de ofertas
✅ Estadísticas reales en dashboard
✅ Búsquedas programadas automáticas
✅ Sistema completo sin simulaciones