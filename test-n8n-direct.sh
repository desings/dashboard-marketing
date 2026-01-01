#!/bin/bash

echo "🚀 PRUEBA RÁPIDA DE N8N"
echo "======================="
echo ""

# Test the webhook directly
echo "Probando webhook de n8n..."
curl -X POST "https://vmi2907616.contaboserver.net/webhook/facebook-publish-real" \
  -H "Content-Type: application/json" \
  -d '{"content":{"text":"Test desde terminal"},"message":"Test desde terminal","test":true}' \
  --max-time 10 \
  -w "\n\nResponse status: %{http_code}\n"

echo ""
echo "Si ves 'success: true', ¡n8n está funcionando!"
echo "Si ves 404, el workflow no está activo."