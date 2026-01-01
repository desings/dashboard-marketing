# 🔧 Configuración OAuth2 de Facebook en n8n

## ✅ Sistema Híbrido Implementado

He creado un sistema híbrido que:
1. **Primero intenta** usar n8n (OAuth2)
2. **Si n8n falla**, usa la API directa como fallback

## 📋 Para activar n8n (recomendado):

### 1. **Ve a n8n**
```
https://vmi2907616.contaboserver.net
```

### 2. **Activa el workflow "Facebook Real Publishing"**
- Ve a Workflows
- Busca "Facebook Real Publishing" 
- Haz clic en el **toggle ON** (esquina superior derecha)
- ✅ El workflow debe estar **ACTIVO**

### 3. **Verifica la credencial "FB TOKEN"**
- Ve a Credentials
- Busca "FB TOKEN"
- Verifica que esté **conectada** (verde)
- Si no, haz clic "Connect my account"

### 4. **Configura el nodo Facebook**
En el workflow:
- Abre el nodo "Facebook Post"
- En **Page ID**: cambia de "me" a tu ID de página
- **Para encontrar tu Page ID**:
  ```
  Ve a tu página de Facebook
  Clic en "About" 
  Busca "Page ID" o usa: https://lookup-id.com
  ```

### 5. **Verifica que funciona**
```bash
curl -s "http://localhost:3000/api/n8n-test"
```

## 🚀 Ventajas del sistema actual:

### ✅ **Funciona AHORA**
- Aunque n8n no esté activo, usa fallback
- Las publicaciones no fallan

### ✅ **OAuth2 cuando esté listo**
- Una vez activado n8n, usará OAuth2 automáticamente  
- Tokens permanentes y seguros

### ✅ **Sin interrupciones**
- Cambio transparente entre métodos
- Los usuarios no notan la diferencia

## 🎯 **Estado actual:**

1. **n8n webhook**: ❌ Inactivo (workflow no activado)
2. **API directa**: ✅ Funcionando como fallback
3. **OAuth2**: ⏳ Listo cuando actives el workflow

## 🔧 **Una vez que actives n8n:**

Las publicaciones usarán automáticamente:
- ✅ Token OAuth2 permanente de n8n
- ✅ Sin expiración de tokens
- ✅ Manejo automático de renovación
- ✅ Mayor seguridad

**¡Solo necesitas activar el workflow en n8n!**