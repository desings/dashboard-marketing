# 🔧 Token "FB TOKEN" Configurado en n8n

## ✅ ¡Excelente! Ya tienes el token configurado

Has creado exitosamente el token **"FB TOKEN"** en n8n con los scopes válidos.

## 🎯 Verificar que todo funciona correctamente

### 1. **Token ya configurado**
- ✅ Nombre: `FB TOKEN`  
- ✅ Scopes válidos configurados
- ✅ OAuth2 activo en n8n

### 2. **Verificación del Token**

#### Desde tu dashboard:
```bash
curl "http://localhost:3000/api/facebook-token-info?useConfig=true"
```

#### Desde el navegador:
```
http://localhost:3000/facebook-token-manager
```

### 3. **Test de Publicación**

Ahora puedes probar que las publicaciones funcionan sin errores de token:
```bash
curl -X POST http://localhost:3000/api/publish-real \
  -H "Content-Type: application/json" \
  -d '{"content":"Test desde FB TOKEN","platforms":["facebook"]}'
```

## 📋 Lo que debe mostrar la verificación:

✅ **Token Type**: "PAGE" (no "USER")  
✅ **Expires At**: null o 0 (permanente)  
✅ **Is Valid**: true  
✅ **Recommendation**: "TOKEN_OPTIMAL"

---

## 🚀 Pasos siguientes (solo si hay problemas):

### **Si necesitas reconfigurar:**

#### **Datos de la App de Facebook:**
```
App ID: 1314977153875955
App Secret: a797d865b513dc152ed306d420ee581c
```

#### **OAuth Settings en n8n:**
```
Authorization URL: https://www.facebook.com/v18.0/dialog/oauth
Access Token URL: https://graph.facebook.com/v18.0/oauth/access_token
```

#### **Scopes Críticos (muy importante):**
```
pages_manage_posts,pages_read_engagement,publish_to_groups
```

#### **Grant Type:**
```
Authorization Code
```

### 4. **Conectar la Cuenta**

1. **Haz clic en "Connect my account"**
2. **Acepta todos los permisos** que aparezcan
3. **Importante:** Cuando Facebook pregunte si quieres publicar en nombre de una página, **selecciona "Sí" y elige tu página (IDinmo)**

### 5. **Verificar que sea Token de Página**

Después de conectar:
1. **Edita la credencial**  
2. **Verifica que el token comience diferente** (los Page Tokens tienen un formato específico)
3. **Guarda los cambios**

### 6. **Test de Verificación**

#### Opción A: Desde n8n
- Usa un nodo HTTP Request para hacer una prueba:
```
GET https://graph.facebook.com/v18.0/me?access_token=TU_TOKEN
```

#### Opción B: Desde tu dashboard
```
http://localhost:3000/api/facebook-token-info?useConfig=true
```

## 🏆 Ventajas de usar OAuth2 en n8n:

### ✅ **Page Access Tokens Automáticos**
- n8n puede solicitar automáticamente Page Tokens en lugar de User Tokens
- Los Page Tokens **NUNCA caducan**

### ✅ **Refresh Automático** 
- n8n maneja automáticamente la renovación de tokens si es necesario

### ✅ **Scopes Correctos**
- Al usar OAuth2, obtienes automáticamente los permisos necesarios

### ✅ **Menos Mantenimiento**
- No necesitas scripts manuales ni renovaciones

## 🔧 Si el token sigue caducando:

### **Problema: Token de Usuario en lugar de Página**

#### Solución:
1. **Borra la credencial actual** en n8n
2. **Crea una nueva** credencial Facebook
3. **Durante el OAuth flow:**
   - Cuando Facebook pregunte por permisos de página
   - **SELECCIONA la página "IDinmo"**
   - **Acepta publicar en nombre de la página**

### **Verificar que sea Page Token:**
- Los Page Tokens suelen ser más largos
- No tienen fecha de expiración
- El tipo debe ser "PAGE" (no "USER")

## 🚀 Resultado Final

Con OAuth2 configurado correctamente en n8n:
- ✅ Token permanente que nunca caduca
- ✅ Publicación directa en tu página de Facebook
- ✅ Sin errores de autenticación
- ✅ Mantenimiento automático por parte de n8n

## 💡 Tip Extra

Si quieres verificar el tipo de token desde n8n, añade un nodo HTTP Request con:
```
GET https://graph.facebook.com/v18.0/debug_token?input_token={{$credentials.access_token}}&access_token=1314977153875955|a797d865b513dc152ed306d420ee581c
```

Esto te dirá si es "USER" o "PAGE" token.

---

**¿Necesitas ayuda configurando OAuth2 en n8n? Te puedo guiar paso a paso.**