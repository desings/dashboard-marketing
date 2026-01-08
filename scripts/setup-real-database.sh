#!/bin/bash

echo "🚀 CONFIGURACIÓN RÁPIDA - BASE DE DATOS REAL"
echo "========================================="
echo ""

# Verificar que existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

echo "📋 PASOS PARA ACTIVAR FUNCIONALIDAD REAL:"
echo ""
echo "1. ✅ Demos eliminados - sistema configurado para funcionalidad real"
echo "2. ⏳ Necesitas configurar base de datos PostgreSQL"
echo ""

echo "🔧 OPCIONES DE BASE DE DATOS:"
echo ""
echo "A) SUPABASE (Recomendado - más fácil)"
echo "   • Ve a: https://supabase.com"
echo "   • Crear proyecto"
echo "   • Copia el DATABASE_URL"
echo ""
echo "B) RAILWAY (También fácil)"
echo "   • Ve a: https://railway.app" 
echo "   • Crear PostgreSQL"
echo "   • Copia el DATABASE_URL"
echo ""
echo "C) LOCAL (Para desarrollo)"
echo "   • docker run --name dashboard-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=dashboard_marketing -p 5432:5432 -d postgres:15"
echo "   • DATABASE_URL=postgresql://postgres:password@localhost:5432/dashboard_marketing"
echo ""

echo "📝 DESPUÉS DE ELEGIR UNA OPCIÓN:"
echo ""
echo "1. Configurar en Vercel:"
echo "   • Settings → Environment Variables" 
echo "   • Name: DATABASE_URL"
echo "   • Value: tu connection string de PostgreSQL"
echo ""
echo "2. Ejecutar migraciones:"
echo "   • npm run db:deploy"
echo ""
echo "3. Redeploy en Vercel para aplicar cambios"
echo ""

echo "🎯 UNA VEZ CONFIGURADO:"
echo "   • El scraping será 100% real de InfoJobs"
echo "   • Las ofertas se guardan en tu base de datos"
echo "   • Sin fallbacks demo"
echo ""

read -p "🤔 ¿Has configurado ya tu DATABASE_URL? (y/n): " configured

if [ "$configured" = "y" ]; then
    echo ""
    echo "🚀 ¡Perfecto! Ejecutando migraciones..."
    echo ""
    
    # Verificar si existe DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  DATABASE_URL no encontrada como variable de entorno local"
        echo "   Asegúrate de configurarla en Vercel y hacer redeploy"
        echo ""
    else
        echo "✅ DATABASE_URL configurada localmente"
        echo ""
    fi
    
    # Generar Prisma client
    echo "📦 Generando Prisma client..."
    npx prisma generate
    
    # Intentar ejecutar migraciones
    echo "🗃️  Ejecutando migraciones..."
    if npx prisma migrate deploy 2>/dev/null; then
        echo "✅ Migraciones ejecutadas exitosamente"
        echo ""
        echo "🎉 ¡CONFIGURACIÓN COMPLETADA!"
        echo "   Tu sistema ahora usa funcionalidad 100% real"
        echo "   Ve a tu dashboard y prueba crear una búsqueda"
        echo ""
    else
        echo "⚠️  No se pudieron ejecutar migraciones localmente"
        echo "   Esto es normal si la DB está en la nube"
        echo "   Las migraciones se ejecutarán automáticamente en Vercel"
        echo ""
        echo "🔄 SIGUIENTE PASO:"
        echo "   • Hacer redeploy en Vercel para aplicar DATABASE_URL"
        echo "   • Las migraciones se ejecutarán automáticamente"
        echo ""
    fi
    
else
    echo ""
    echo "📋 ENTONCES NECESITAS:"
    echo "1. Ir a Supabase.com o Railway.app"
    echo "2. Crear base de datos PostgreSQL"
    echo "3. Copiar el DATABASE_URL"
    echo "4. Configurarlo en Vercel como variable de entorno"
    echo "5. Hacer redeploy"
    echo "6. Ejecutar este script otra vez"
    echo ""
fi

echo "📚 DOCUMENTACIÓN COMPLETA:"
echo "   • Lee: CONFIGURACION_BASE_DATOS_REAL.md"
echo ""