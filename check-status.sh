#!/bin/bash

echo "🔍 DIAGNÓSTICO DE FACEBOOK PUBLISHING"
echo "======================================"
echo ""

echo "1. ✅ Verificando n8n..."
N8N_STATUS=$(curl -s "http://localhost:3000/api/n8n-test" | jq -r '.success // false')
if [ "$N8N_STATUS" = "true" ]; then
    echo "   ✅ n8n webhook funcionando"
else
    echo "   ❌ n8n webhook no disponible"
    echo "   💡 SOLUCIÓN: Activa el workflow en n8n"
fi
echo ""

echo "2. 🔑 Verificando token..."
TOKEN_VALID=$(curl -s "http://localhost:3000/api/facebook-token-info?useConfig=true" | jq -r '.isValid // false')
if [ "$TOKEN_VALID" = "true" ]; then
    echo "   ✅ Token válido"
else
    echo "   ❌ Token inválido/expirado"
    echo "   💡 SOLUCIÓN: OAuth2 en n8n eliminará este problema"
fi
echo ""

echo "3. 🔗 Estado de URLs importantes:"
echo "   • n8n: https://vmi2907616.contaboserver.net"
echo "   • Diagnóstico: http://localhost:3000/facebook-diagnostic"
echo ""

echo "📋 PASOS PARA SOLUCIONAR:"
echo "========================="
echo "1. Ve a: https://vmi2907616.contaboserver.net"
echo "2. Busca workflow 'Facebook Real Publishing'"
echo "3. Activa el workflow (toggle ON)"
echo "4. Verifica credencial 'FB TOKEN'"
echo "5. Prueba: curl http://localhost:3000/api/n8n-test"
echo ""

if [ "$N8N_STATUS" = "true" ]; then
    echo "🎉 ¡TODO FUNCIONANDO! Ya puedes publicar."
else
    echo "⚠️  Activa n8n para completar la configuración."
fi

