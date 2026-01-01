# ARQUITECTURA COMPLETA CRM OAUTH 2.0

## 🏗️ ESTRUCTURA DEL PROYECTO

```
src/
├── app/
│   └── api/
│       ├── oauth/
│       │   └── [provider]/
│       │       ├── connect/
│       │       │   └── route.ts          # Inicia flujo OAuth
│       │       └── callback/
│       │           └── route.ts          # Recibe callback OAuth
│       ├── social-accounts/
│       │   └── route.ts                  # CRUD cuentas sociales
│       └── publish-content/
│           └── route.ts                  # Publicar contenido
├── components/
│   └── ConnectedAccounts.tsx             # Panel de cuentas frontend
├── lib/
│   ├── supabase.ts                       # Cliente y tipos Supabase
│   ├── token-manager.ts                  # Gestión automática de tokens
│   └── social-publisher.ts               # Publicación multi-plataforma
└── supabase/
    └── schema.sql                        # Esquema de base de datos
```

## 📊 ESQUEMA DE BASE DE DATOS

### Tabla `social_accounts`
- **id**: UUID (Primary Key)
- **user_id**: UUID (FK a users)
- **provider**: 'facebook' | 'instagram' | 'google' | 'pinterest'
- **provider_account_id**: ID de la cuenta en el proveedor
- **provider_account_name**: Nombre/handle de la cuenta
- **access_token**: Token de acceso actual
- **refresh_token**: Token de renovación (Google/Pinterest)
- **long_lived_token**: Token de larga duración (Facebook/Instagram)
- **expires_at**: Fecha/hora de expiración
- **scopes**: Array de permisos otorgados
- **status**: 'active' | 'expired' | 'error' | 'revoked'

## 🔄 FLUJO OAUTH COMPLETO

### 1. Conexión de Cuenta
```
Frontend -> /api/oauth/{provider}/connect?user_id=123
  ↓
Redirección a proveedor OAuth
  ↓
Usuario autoriza en proveedor
  ↓
Callback -> /api/oauth/{provider}/callback
  ↓
Intercambio de código por tokens
  ↓
Guardado en Supabase
```

### 2. Renovación Automática de Tokens
```
Antes de usar token:
TokenManager.getValidSocialAccount(accountId)
  ↓
¿Token caducado? -> Renovar automáticamente
  ↓
Actualizar en Supabase
  ↓
Retornar cuenta válida
```

### 3. Publicación con Validación
```
API Request -> /api/publish-content
  ↓
Validar cuentas del usuario
  ↓
Para cada cuenta: getValidSocialAccount()
  ↓
Publicar en plataforma específica
  ↓
Guardar resultados en DB
```

## 🛡️ ARQUITECTURA DE SEGURIDAD

### Backend-Only OAuth
- ✅ Intercambio de códigos solo en servidor
- ✅ Long-lived tokens obtenidos en backend
- ✅ Refresh tokens almacenados de forma segura
- ✅ No exposición de secrets al frontend

### Renovación Inteligente
- ✅ Verificación automática antes de usar tokens
- ✅ Renovación 15 minutos antes de expirar
- ✅ Fallback a reautenticación si falla renovación
- ✅ Estado de cuenta actualizado automáticamente

### Validación por Usuario
- ✅ Cuentas vinculadas por user_id
- ✅ Verificación de permisos en cada request
- ✅ Isolation entre tenants/usuarios

## 🔧 CONFIGURACIÓN REQUERIDA

### 1. Variables de Entorno
```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PINTEREST_CLIENT_ID=
PINTEREST_CLIENT_SECRET=
```

### 2. Configuración OAuth en Supabase
```sql
INSERT INTO oauth_configurations (tenant_id, provider, client_id, client_secret, redirect_uri, scopes) VALUES
('default', 'facebook', 'YOUR_FB_ID', 'YOUR_FB_SECRET', 'https://yourdomain.com/api/oauth/facebook/callback', 
 ARRAY['pages_manage_posts', 'pages_read_engagement']),
('default', 'google', 'YOUR_GOOGLE_ID', 'YOUR_GOOGLE_SECRET', 'https://yourdomain.com/api/oauth/google/callback',
 ARRAY['https://www.googleapis.com/auth/youtube.upload']);
```

### 3. URLs de Callback
- Facebook: `https://yourdomain.com/api/oauth/facebook/callback`
- Instagram: `https://yourdomain.com/api/oauth/instagram/callback`
- Google: `https://yourdomain.com/api/oauth/google/callback`
- Pinterest: `https://yourdomain.com/api/oauth/pinterest/callback`

## 📱 INTERFAZ FRONTEND

### Componente ConnectedAccounts
- ✅ Lista de cuentas conectadas con estado
- ✅ Botones para conectar nuevos proveedores
- ✅ Indicadores de expiración y reautenticación
- ✅ Acciones de renovar/desconectar
- ✅ Visualización de permisos otorgados

### Estados de Cuenta
- **🟢 Activo**: Token válido, listo para usar
- **🟡 Expira Pronto**: Token válido pero expira en <24h
- **🟠 Reautenticar**: Token expirado, requiere nueva autorización
- **🔴 Error**: Problema con la cuenta, verificar configuración

## 🚀 ENDPOINTS API

### OAuth
- `GET /api/oauth/{provider}/connect` - Inicia flujo OAuth
- `GET /api/oauth/{provider}/callback` - Procesa callback OAuth

### Gestión de Cuentas
- `GET /api/social-accounts?user_id=123` - Lista cuentas del usuario
- `POST /api/social-accounts` - Fuerza renovación de token
- `DELETE /api/social-accounts?account_id=abc` - Elimina cuenta

### Publicación
- `POST /api/publish-content` - Publica contenido inmediato/programado

## 📊 BENEFICIOS DE ESTA ARQUITECTURA

### Para Desarrolladores
- ✅ Gestión centralizada de tokens
- ✅ Renovación automática sin intervención
- ✅ Manejo consistente de errores
- ✅ Escalabilidad multi-tenant

### Para Usuarios
- ✅ Conexión única por proveedor
- ✅ Indicadores claros de estado
- ✅ Reautenticación solo cuando es necesaria
- ✅ Publicación confiable multi-plataforma

### Para Operaciones
- ✅ Logs centralizados de tokens
- ✅ Monitoreo de salud de cuentas
- ✅ Auditoría de publicaciones
- ✅ Recuperación automática de errores

## 🔮 PRÓXIMOS PASOS

1. **Configurar Supabase** con el esquema proporcionado
2. **Obtener credenciales OAuth** de cada proveedor  
3. **Configurar URLs públicas** (Vercel/ngrok)
4. **Probar flujo completo** con una cuenta
5. **Integrar componente** en página de configuración
6. **Implementar cron job** para renovación masiva de tokens
7. **Añadir analytics** y métricas de publicaciones