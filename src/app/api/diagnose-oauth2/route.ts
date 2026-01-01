import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    problem: "❌ Error de Permisos OAuth2 de Facebook",
    error_details: {
      message: "Forbidden - perhaps check your credentials?",
      facebook_error: "#200 - Requires pages_read_engagement and pages_manage_posts permission",
      current_issue: "OAuth2 token doesn't have page publishing permissions"
    },
    diagnosis: {
      token_type: "❌ User Token (incorrect) - necesita Page Token",
      permissions_missing: [
        "pages_read_engagement",
        "pages_manage_posts"
      ],
      scope_needed: "pages_manage_posts,pages_read_engagement,public_profile"
    },
    solution_steps: [
      {
        step: 1,
        title: "Obtener Page Token",
        description: "Tu OAuth2 actual es un User Token. Necesitas un Page Token.",
        action: "Ve a Facebook App → Add Product → Facebook Login → Permissions"
      },
      {
        step: 2,
        title: "Configurar Permisos Correctos",
        description: "Agregar permisos de página",
        permissions: [
          "pages_read_engagement - Leer información de páginas", 
          "pages_manage_posts - Crear y gestionar posts de página"
        ]
      },
      {
        step: 3,
        title: "Intercambiar por Page Token",
        description: "Usar User Token para obtener Page Token permanente",
        example_api_call: "GET /me/accounts?access_token=USER_TOKEN"
      }
    ],
    workaround: {
      current_status: "✅ Sistema híbrido funcionando",
      fallback_method: "API directa con token hardcodeado",
      recommendation: "Continúa usando sistema actual mientras resuelves OAuth2"
    },
    test_endpoints: {
      current_system: "/api/publish-via-n8n",
      oauth2_test: "https://vmi2907616.contaboserver.net/webhook/facebook-oauth2-publish",
      direct_fallback: "/api/publish-real"
    }
  });
}

export async function POST() {
  try {
    // Test actual OAuth2 credentials
    console.log('🔍 Testing OAuth2 Facebook credentials...');
    
    // Primero probar el webhook OAuth2
    const webhookResponse = await fetch('https://vmi2907616.contaboserver.net/webhook/facebook-oauth2-publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: { text: '🧪 Diagnóstico OAuth2' },
        message: 'Test diagnóstico OAuth2'
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (webhookResponse.ok) {
      const result = await webhookResponse.json();
      return NextResponse.json({
        status: "✅ OAuth2 Working",
        message: "¡OAuth2 ya está funcionando correctamente!",
        result,
        next_action: "Tu sistema OAuth2 está operativo. Ya no necesitas el fallback."
      });
    } else {
      const error = await webhookResponse.text();
      
      // Analizar el error específico
      if (error.includes('Forbidden')) {
        return NextResponse.json({
          status: "❌ OAuth2 Permissions Issue",
          error: "Token OAuth2 sin permisos de página",
          solution: "Necesitas configurar Page Token con permisos pages_manage_posts",
          current_token_analysis: {
            type: "User Token (incorrecto)",
            needed: "Page Token con permisos de página",
            fix: "Intercambiar User Token por Page Token"
          },
          immediate_action: "Ve a Facebook Developers → App → OAuth2 → Upgrade to Page Token"
        }, { status: 403 });
      }
      
      if (error.includes('404')) {
        return NextResponse.json({
          status: "⏳ Webhook Not Ready",
          message: "Workflow OAuth2 creado pero webhook aún no registrado",
          wait_time: "Espera 30-60 segundos y vuelve a intentar",
          alternative: "Usa /api/publish-via-n8n que tiene fallback automático"
        }, { status: 503 });
      }

      return NextResponse.json({
        status: "❌ OAuth2 Error",
        error: "Error inesperado en OAuth2",
        details: error,
        recommendation: "Verifica configuración en n8n"
      }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      status: "❌ Network Error", 
      error: "No se puede conectar al webhook OAuth2",
      details: error instanceof Error ? error.message : 'Unknown error',
      check: "Verifica que n8n esté funcionando y el workflow esté activo"
    }, { status: 500 });
  }
}