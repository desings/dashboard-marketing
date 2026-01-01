# 🔧 Configuración de n8n para Dashboard Marketing

## 📋 Workflows necesarios en n8n

### 1. **Webhook: dashboard-publish**
- **URL**: `/webhook/dashboard-publish`
- **Método**: POST
- **Propósito**: Recibe solicitudes de publicación del dashboard

**Estructura del workflow:**
```
Webhook → Validar Datos → Determinar Plataformas → [Facebook/Instagram/Twitter/LinkedIn] → Respuesta
```

### 2. **Webhook: dashboard-account**  
- **URL**: `/webhook/dashboard-account`
- **Método**: POST
- **Propósito**: Gestiona conexiones de cuentas sociales

**Estructura del workflow:**
```
Webhook → Validar Acción → [Conectar/Desconectar/Validar] → OAuth → Respuesta
```

## 🔑 Configuración de Credenciales en n8n

### **Facebook/Instagram:**
1. Ve a Credentials > Add Credential
2. Selecciona "Facebook Graph API"
3. Configura:
   - **App ID**: Tu Facebook App ID
   - **App Secret**: Tu Facebook App Secret
   - **Access Token**: Se obtiene via OAuth

### **Twitter:**
1. Credentials > Add Credential > "Twitter API"
2. Configura:
   - **API Key**: Tu Twitter API Key
   - **API Secret**: Tu Twitter API Secret
   - **Access Token**: Se obtiene via OAuth

### **LinkedIn:**
1. Credentials > Add Credential > "LinkedIn API"
2. Configura:
   - **Client ID**: Tu LinkedIn Client ID
   - **Client Secret**: Tu LinkedIn Client Secret

## 📡 Payload Examples

### **Publicación (POST /webhook/dashboard-publish):**
```json
{
  "tenantId": "tenant_123",
  "clientId": "client_456", 
  "platforms": ["facebook", "instagram"],
  "content": {
    "text": "¡Nuevo producto disponible!",
    "images": ["https://ejemplo.com/imagen1.jpg"],
    "scheduledAt": "2025-12-21T10:00:00Z"
  },
  "settings": {
    "facebook": {
      "pageId": "page_123"
    },
    "instagram": {
      "type": "post"
    }
  },
  "trigger": {
    "source": "dashboard-marketing",
    "timestamp": "2025-12-20T15:30:00Z"
  }
}
```

### **Gestión de Cuenta (POST /webhook/dashboard-account):**
```json
{
  "tenantId": "tenant_123",
  "clientId": "client_456",
  "action": "connect",
  "platform": "facebook",
  "trigger": {
    "source": "dashboard-marketing",
    "timestamp": "2025-12-20T15:30:00Z",
    "requestId": "req_123456"
  }
}
```

## 🔄 Respuestas Esperadas de n8n

### **Para publicaciones:**
```json
{
  "success": true,
  "publishId": "pub_123456",
  "results": {
    "facebook": {
      "status": "published",
      "postId": "fb_post_123"
    },
    "instagram": {
      "status": "scheduled", 
      "mediaId": "ig_media_456"
    }
  }
}
```

### **Para gestión de cuentas (conectar):**
```json
{
  "success": true,
  "authUrl": "https://www.facebook.com/dialog/oauth?...",
  "requestId": "req_123456"
}
```

## ⚙️ Variables de Entorno para Dashboard

Configura estas variables en tu archivo `.env`:

```bash
# N8N Configuration  
N8N_BASE_URL="https://tu-instancia.n8n.cloud"
N8N_WEBHOOK_URL="https://tu-instancia.n8n.cloud/webhook/dashboard-publish"
N8N_ACCOUNT_WEBHOOK="https://tu-instancia.n8n.cloud/webhook/dashboard-account"
N8N_AUTH_TOKEN="tu_token_de_autenticacion_n8n"
```

## 🚀 Próximos Pasos

1. **Crear los webhooks** en tu instancia n8n
2. **Configurar las credenciales** de redes sociales en n8n  
3. **Actualizar las URLs** en el archivo `.env` del dashboard
4. **Probar la conexión** entre dashboard y n8n

## 🔒 Seguridad

- Usa tokens de autenticación en los headers (`X-Dashboard-Auth`)
- Valida los payloads en n8n antes de procesar
- Configura IPs permitidas si tu n8n lo soporta
- Usa HTTPS en producción