# Dashboard Marketing Multi-cliente - Guía de Desarrollo

## 🎯 Estado Actual (COMPLETADO ✅)

### ✅ Funcionalidades implementadas:
- **Autenticación**: Login con JWT + cookie session
- **Multi-tenant**: Selector de cliente funcional con persistencia
- **Base de datos**: Prisma + PostgreSQL en Render sincronizada
- **UI**: Dashboard básico con módulos futuros visualizados
- **APIs REST**: Login, tenants, setup completamente funcionales

### ✅ Entidades preparadas para el futuro:
- `SocialAccount` - Cuentas de redes sociales por cliente
- `ScheduledPost` - Contenido programado para RRSS
- `AnalyticsSnapshot` - Métricas y KPIs por cliente/fecha

## 🚀 Cómo usar ahora mismo

### 1. Inicializar datos demo (solo primera vez):
```bash
curl -X POST http://localhost:3000/api/setup
```

### 2. Hacer login:
- Ve a: http://localhost:3000/login
- Email: `admin@local.com` (o tu ADMIN_EMAIL)
- Password: Tu ADMIN_PASSWORD del .env

### 3. Usar dashboard:
- Se abre automáticamente el dashboard
- Cambia entre clientes con el selector
- La selección se guarda en localStorage

## 🔧 Comandos útiles

```bash
# Desarrollo
npm run dev

# Sincronizar cambios de schema
npx prisma db push

# Ver/editar datos
npx prisma studio

# Ver esquema actual
npx prisma introspect
```

## 📋 Próximas funcionalidades a implementar

### 🥇 Prioridad alta (próximas 2-4 semanas):
1. **Módulo RRSS**: 
   - CRUD de SocialAccount 
   - Integración API de Instagram/Facebook
   - Programar posts básico

2. **Módulo Estadísticas**:
   - Dashboard de métricas por cliente
   - Gráficos con Chart.js o similar
   - Snapshots automáticos

### 🥈 Prioridad media (1-2 meses):
1. **Módulo Mensajes**: Bandeja unificada
2. **Cron jobs**: Workers para publicación automática
3. **Mejores filtros**: Por fecha, cliente, estado

### 🥉 Futuro (2+ meses):
1. **Multi-usuario**: Invitar otros usuarios a tenants
2. **Roles avanzados**: Editor, Viewer, etc.
3. **Billing**: Suscripciones por cliente
4. **Reportes**: PDFs automáticos
5. **Mobile app**: React Native

## 🔒 Seguridad

### ⚠️ IMPORTANTE - Antes de producción:
1. **Eliminar `/api/setup`** - Solo para desarrollo
2. **Implementar registro real** de usuarios/tenants
3. **Variables de entorno** más seguras
4. **Rate limiting** en APIs
5. **HTTPS obligatorio**

## 🏗 Arquitectura actual

```
src/app/
├── api/
│   ├── auth/login/     ✅ JWT + cookie session
│   ├── setup/          ⚠️ Solo desarrollo  
│   └── tenants/        ✅ Lista por usuario
├── dashboard/          ✅ Selector + módulos
└── login/              ✅ Form funcional

prisma/
└── schema.prisma       ✅ Multi-tenant + entidades futuras
```

## 📊 Base de datos

### Tablas principales:
- `User` - Usuarios del sistema
- `Tenant` - Clientes (multi-tenant)
- `UserTenant` - Relación usuario-cliente con roles

### Tablas futuras (ya creadas):
- `SocialAccount` - Cuentas de RRSS por cliente
- `ScheduledPost` - Posts programados
- `AnalyticsSnapshot` - Métricas históricas

## 🐛 Debug común

### Si no carga tenants:
1. Verificar que existe el usuario: `npx prisma studio`
2. Verificar JWT_SECRET en .env
3. Borrar cookies del navegador

### Si fallan las migraciones:
1. Usar `prisma db push` en lugar de `migrate`
2. Render no permite shadow DB

### Si hay conflictos de Next:
1. Borrar `.next/` y reinstalar: `rm -rf .next && npm run dev`
2. Verificar que no hay package-lock.json en carpetas padre

---

**Estado**: ✅ MVP completamente funcional
**Próximo paso**: Elegir entre módulo RRSS o Estadísticas para implementar primero