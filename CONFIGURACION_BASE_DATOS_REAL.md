# 🗃️ CONFIGURACIÓN BASE DE DATOS REAL

Para que el módulo de "Búsqueda Clientes" funcione completamente necesitas configurar una base de datos PostgreSQL real.

## ⚡ OPCIÓN RÁPIDA - SUPABASE (RECOMENDADA)

### 1. Crear proyecto en Supabase
```bash
# Ve a https://supabase.com
# Crear nuevo proyecto
# Seleccionar región Europa (por velocidad)
# Nombre: "dashboard-marketing"
```

### 2. Obtener credenciales
```bash
# En Supabase Dashboard → Settings → Database
# Copia la "Connection string"
# Ejemplo: postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

### 3. Configurar en Vercel
```bash
# En Vercel Dashboard → tu proyecto → Settings → Environment Variables
# Agregar nueva variable:
```
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres`

### 4. Ejecutar migraciones
```bash
# En tu terminal local:
npm run db:deploy
# o
npx prisma migrate deploy
npx prisma generate
```

---

## 🚀 OPCIÓN RÁPIDA 2 - RAILWAY

### 1. Crear proyecto en Railway
```bash
# Ve a https://railway.app
# Login con GitHub
# Crear nuevo proyecto → PostgreSQL
```

### 2. Obtener credenciales
```bash
# En Railway Dashboard → PostgreSQL → Connect → Environment Variables
# Copia el DATABASE_URL
```

### 3. Configurar igual que Supabase (paso 3 arriba)

---

## 🔧 CONFIGURAR AHORA MISMO

**Sigue estos pasos para activar la funcionalidad real:**

### Paso 1: Crear base de datos (elige una opción)
- [ ] Supabase (más fácil)
- [ ] Railway (también fácil) 
- [ ] Local con Docker

### Paso 2: Configurar DATABASE_URL en Vercel
```bash
# Variable de entorno:
DATABASE_URL=postgresql://[usuario]:[password]@[host]:[puerto]/[database]
```

### Paso 3: Ejecutar desde tu terminal
```bash
cd /Users/deivid/dashboard-marketing
npm run db:deploy
```

### Paso 4: Redeploy en Vercel
```bash
# Desde Vercel Dashboard, hacer redeploy para aplicar la nueva variable
```

---

## ✅ VERIFICAR QUE FUNCIONA

Una vez configurado:
1. Ve a tu dashboard → Búsqueda Clientes
2. Crea una nueva búsqueda
3. Debería scraping REAL de InfoJobs (sin "modo demo")
4. Las ofertas se guardan en tu base de datos PostgreSQL

---

## 💡 DATOS IMPORTANTES

- **Sin base de datos**: El sistema fallará con errores 500
- **Con base de datos real**: Scraping automático de InfoJobs
- **BullMQ**: Para tareas automáticas necesitarás Redis también
- **Puppeteer**: Ya optimizado para Vercel serverless

---

## 🔴 PROBLEMAS COMUNES

### Error: "PrismaClient initialization failed"
- **Causa**: DATABASE_URL no configurada o incorrecta
- **Solución**: Verificar variable en Vercel y hacer redeploy

### Error: "connect ECONNREFUSED"
- **Causa**: Base de datos no accesible
- **Solución**: Verificar que la base de datos esté corriendo

### Error: "password authentication failed"
- **Causa**: Credenciales incorrectas
- **Solución**: Regenerar password en Supabase/Railway

---

**🎯 SIGUIENTE PASO: Configurar tu DATABASE_URL ahora mismo para que funcione de verdad.**