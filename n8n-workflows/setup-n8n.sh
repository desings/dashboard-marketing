#!/bin/bash

# Script para configurar workflows n8n automáticamente
# Requiere que tengas acceso API a tu instancia n8n

# Configuración
N8N_BASE_URL="${N8N_BASE_URL:-https://tu-instancia.n8n.cloud}"
N8N_API_KEY="${N8N_API_KEY:-tu-api-key}"

echo "🚀 Configurando workflows n8n para Dashboard Marketing"
echo "📡 N8N URL: $N8N_BASE_URL"

# Función para crear workflow
create_workflow() {
    local workflow_file=$1
    local workflow_name=$2
    
    echo "📋 Creando workflow: $workflow_name"
    
    response=$(curl -s -X POST "$N8N_BASE_URL/api/v1/workflows" \
        -H "Authorization: Bearer $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$workflow_file")
    
    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        workflow_id=$(echo "$response" | jq -r '.id')
        echo "✅ Workflow '$workflow_name' creado con ID: $workflow_id"
        
        # Activar el workflow
        curl -s -X POST "$N8N_BASE_URL/api/v1/workflows/$workflow_id/activate" \
            -H "Authorization: Bearer $N8N_API_KEY" > /dev/null
        echo "🟢 Workflow activado"
        
        # Obtener URL del webhook
        webhook_url=$(echo "$response" | jq -r '.nodes[] | select(.type == "n8n-nodes-base.webhook") | .webhookUrl // empty')
        if [ ! -z "$webhook_url" ]; then
            echo "🔗 URL del webhook: $webhook_url"
        fi
        
    else
        echo "❌ Error creando workflow '$workflow_name'"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
    
    echo ""
}

# Verificar dependencias
if ! command -v curl &> /dev/null; then
    echo "❌ curl no está instalado"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ jq no está instalado. Instálalo con: brew install jq"
    exit 1
fi

# Verificar configuración
if [ "$N8N_BASE_URL" = "https://tu-instancia.n8n.cloud" ] || [ -z "$N8N_API_KEY" ]; then
    echo "❌ Configura las variables de entorno:"
    echo "   export N8N_BASE_URL='https://tu-instancia.n8n.cloud'"
    echo "   export N8N_API_KEY='tu-api-key'"
    exit 1
fi

# Crear directorio si no existe
mkdir -p "$(dirname "$0")"

# Crear workflows
create_workflow "$(dirname "$0")/dashboard-publish-workflow.json" "Dashboard Publish"
create_workflow "$(dirname "$0")/dashboard-account-workflow.json" "Dashboard Account Management"

echo "🎉 Configuración de n8n completada!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Actualiza tu archivo .env con las URLs de los webhooks"
echo "2. Configura las credenciales de redes sociales en n8n"
echo "3. Prueba los endpoints desde tu dashboard"