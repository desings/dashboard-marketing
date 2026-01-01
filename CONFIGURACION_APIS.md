# 🚀 Configuración de APIs para Redes Sociales

## Variables de Entorno Requeridas

Para habilitar la publicación automática en redes sociales, necesitas configurar las siguientes variables de entorno en tu archivo `.env`:

### Facebook & Instagram
```bash
# Facebook App (requerido también para Instagram Business)
FACEBOOK_APP_ID=tu_facebook_app_id
FACEBOOK_APP_SECRET=tu_facebook_app_secret
FACEBOOK_WEBHOOK_VERIFY_TOKEN=tu_token_personalizado_para_webhooks
```

### Twitter/X
```bash
# Twitter API v2 
TWITTER_CLIENT_ID=tu_twitter_client_id
TWITTER_CLIENT_SECRET=tu_twitter_client_secret
TWITTER_BEARER_TOKEN=tu_bearer_token
```

### LinkedIn
```bash
# LinkedIn API
LINKEDIN_CLIENT_ID=tu_linkedin_client_id  
LINKEDIN_CLIENT_SECRET=tu_linkedin_client_secret
```

### Configuración General
```bash
# URL base de tu aplicación (para OAuth callbacks)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # En desarrollo
# NEXT_PUBLIC_BASE_URL=https://tu-dominio.com  # En producción
```

---

## 📋 Guía de Configuración por Plataforma

### 1. Facebook & Instagram

**Pasos:**
1. Ve a [Facebook for Developers](https://developers.facebook.com/)
2. Crea una nueva "App" o usa una existente
3. Agrega los productos "Facebook Login" e "Instagram Basic Display"
4. Para Instagram Business, también agrega "Instagram Graph API"
5. Configura las URLs de redirección OAuth:
   - `http://localhost:3000/api/oauth/callback/facebook`
   - `https://tu-dominio.com/api/oauth/callback/facebook`

**Permisos requeridos:**
- `pages_manage_posts` - Publicar en páginas de Facebook
- `pages_read_engagement` - Leer métricas de engagement  
- `pages_show_list` - Listar páginas administradas
- `business_management` - Gestión de cuentas Business
- `instagram_basic` - Acceso básico a Instagram
- `instagram_content_publish` - Publicar contenido en Instagram

### 2. Twitter/X

**Pasos:**
1. Ve a [Twitter Developer Portal](https://developer.twitter.com/)
2. Crea un nuevo "Project" y "App"
3. Habilita OAuth 2.0 y configura:
   - Type of App: `Web App`
   - Callback URLs: `http://localhost:3000/api/oauth/callback/twitter`
4. Obtén las credenciales de la sección "Keys and Tokens"

**Permisos requeridos:**
- `tweet.read` - Leer tweets
- `tweet.write` - Crear tweets
- `users.read` - Leer información del usuario

### 3. LinkedIn

**Pasos:**
1. Ve a [LinkedIn Developers](https://developer.linkedin.com/)
2. Crea una nueva aplicación
3. En "Auth", agrega las URLs de redirección:
   - `http://localhost:3000/api/oauth/callback/linkedin`
4. Solicita permisos adicionales si es necesario

**Permisos requeridos:**
- `w_member_social` - Publicar contenido social
- `r_liteprofile` - Leer perfil básico
- `r_emailaddress` - Leer email (opcional)

---

## 🔧 Implementación Técnica

### Estado Actual
✅ **Schema de base de datos** - Preparado para tokens OAuth
✅ **Interfaz de usuario** - Página de programación completa  
✅ **APIs básicas** - CRUD de posts programados
✅ **Configuración OAuth** - Estructura preparada

### Próximos pasos para OAuth completo:

1. **Implementar flujo OAuth completo**:
   ```bash
   # APIs a crear
   /api/oauth/[platform]/authorize  # Iniciar autorización
   /api/oauth/[platform]/callback   # Manejar callback
   /api/oauth/[platform]/refresh    # Renovar tokens
   ```

2. **Integrar con APIs de publicación**:
   - Facebook Graph API
   - Instagram Graph API  
   - Twitter API v2
   - LinkedIn Marketing API

3. **Sistema de workers**:
   - Cron job para publicar posts programados
   - Queue system para manejar múltiples publicaciones
   - Retry logic para fallos de API

---

## 🚦 Cómo Empezar

### Opción 1: Desarrollo Local Completo
1. Configura todas las variables de entorno
2. Registra aplicaciones en cada plataforma
3. Implementa OAuth (código adicional requerido)

### Opción 2: Testing Básico (Actual)
1. Usa la interfaz actual para crear posts
2. Los posts se guardan como "scheduled" en la base de datos
3. Implementa la lógica de publicación posteriormente

### Opción 3: Integración Gradual
1. Empieza con una plataforma (ej: Facebook)
2. Completa OAuth y publicación para esa plataforma
3. Replica el patrón para las demás

---

## 📊 Estado de las Funcionalidades

| Funcionalidad | Facebook | Instagram | Twitter | LinkedIn |
|---------------|----------|-----------|---------|----------|
| OAuth Setup | 🟡 Configurado | 🟡 Configurado | 🟡 Configurado | 🟡 Configurado |
| Autorización | ❌ Por implementar | ❌ Por implementar | ❌ Por implementar | ❌ Por implementar |
| Publicación | ❌ Por implementar | ❌ Por implementar | ❌ Por implementar | ❌ Por implementar |
| Métricas | ❌ Por implementar | ❌ Por implementar | ❌ Por implementar | ❌ Por implementar |

**Leyenda:**
- ✅ Completado
- 🟡 Configurado/Preparado  
- ❌ Por implementar

---

## 🔍 Testing de Configuración

Puedes verificar tu configuración visitando:
- `GET /api/oauth/config` - Ver estado de todas las plataformas
- `GET /api/oauth/config?platform=facebook` - Ver configuración específica

La respuesta te indicará qué variables de entorno faltan por configurar.