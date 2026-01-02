# 🚀 Configuración de Cloudinary para Uploads Sin Límites

## ✨ Beneficios de Cloudinary

- **Sin límites de tamaño** para videos e imágenes
- **Optimización automática** de archivos
- **CDN global** para carga rápida
- **25GB gratis** por mes
- **URLs directas** para Facebook

## 📋 Pasos para Configurar

### 1. Crear Cuenta en Cloudinary

1. Ve a [cloudinary.com](https://cloudinary.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Obtener Credenciales

1. En el dashboard de Cloudinary
2. Copia estos valores:
   - **Cloud Name** (ejemplo: `dxxxxx`)
   - **API Key** (ejemplo: `123456789012345`)
   - **API Secret** (ejemplo: `abcdefghijk123`)

### 3. Configurar Variables de Entorno

Edita el archivo `.env.local` y reemplaza:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aquí
CLOUDINARY_API_KEY=tu_api_key_aquí
CLOUDINARY_API_SECRET=tu_api_secret_aquí
```

### 4. Reiniciar Aplicación

```bash
npm run dev
```

## 🎯 ¿Qué Cambia?

### Antes (Vercel base64)
- ❌ Límite: 10MB para videos
- ❌ Conversión lenta a base64
- ❌ Consume memoria del servidor

### Ahora (Cloudinary)
- ✅ Sin límites de tamaño
- ✅ Upload directo y rápido
- ✅ Optimización automática
- ✅ CDN para mejor rendimiento

## 🧪 Probar

1. Configura las variables de entorno
2. Reinicia la app
3. Sube un video grande (>10MB)
4. ¡Debería funcionar perfectamente!

## 📞 Soporte

Si tienes problemas:
1. Verifica que las credenciales sean correctas
2. Asegúrate de que la cuenta de Cloudinary esté activa
3. Revisa la consola del navegador para errores