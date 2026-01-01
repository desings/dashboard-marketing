import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "🔧 Configuración OAuth2 Page Token",
    status: "Permisos correctos disponibles",
    permissions: [
      "✅ pages_manage_posts - Standard Access",
      "✅ pages_read_engagement - Standard Access"
    ],
    next_steps: [
      "1. Verificar que n8n use Page Token, no User Token",
      "2. Testear publicación con credenciales OAuth2",
      "3. Si falla, intercambiar por Page Token específico"
    ]
  });
}

export async function POST() {
  try {
    console.log('🔧 [PAGE TOKEN] Obteniendo Page Token desde OAuth2...');
    
    // Primero vamos a probar con las credenciales OAuth2 actuales
    // para ver si ya tenemos un Page Token o si necesitamos intercambiar
    
    const webhookTestUrl = 'https://vmi2907616.contaboserver.net/webhook/facebook-oauth2-publish';
    
    const testPayload = {
      content: { 
        text: '🧪 Test Page Token OAuth2 - ' + new Date().toISOString().slice(11,19)
      },
      message: 'Test OAuth2 con permisos pages_manage_posts',
      test: true
    };

    console.log('🧪 Testing OAuth2 with current configuration...');
    
    try {
      const testResponse = await fetch(webhookTestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(15000)
      });

      if (testResponse.ok) {
        const result = await testResponse.json();
        
        return NextResponse.json({
          success: true,
          message: "🎉 ¡OAuth2 Facebook funcionando correctamente!",
          result,
          status: "Page Token configurado exitosamente",
          oauth2_working: true,
          next_action: "Tu OAuth2 ya funciona - no necesitas más cambios"
        });
        
      } else {
        const errorText = await testResponse.text();
        console.log('❌ OAuth2 test failed:', errorText);
        
        // Analizar tipo específico de error
        if (errorText.includes('pages_manage_posts') || errorText.includes('pages_read_engagement')) {
          return NextResponse.json({
            success: false,
            message: "❌ OAuth2 necesita Page Token",
            error: "Token actual es User Token, necesita Page Token",
            diagnosis: {
              current: "User Token con permisos correctos",
              needed: "Page Token derivado del User Token",
              solution: "Intercambiar User Token por Page Token específico"
            },
            instructions: [
              "1. Tu User Token tiene permisos correctos",
              "2. Necesitas obtener el Page Token de tu página específica",
              "3. Usar ese Page Token en lugar del User Token"
            ]
          }, { status: 403 });
        }
        
        if (errorText.includes('404')) {
          return NextResponse.json({
            success: false,
            message: "⏳ Webhook OAuth2 aún no registrado",
            wait_instruction: "Espera 1-2 minutos y vuelve a intentar",
            webhook_status: "Creado pero no activo aún"
          }, { status: 503 });
        }
        
        return NextResponse.json({
          success: false,
          message: "❌ Error OAuth2 inesperado",
          error: errorText,
          recommendation: "Revisar configuración en n8n"
        }, { status: 400 });
      }
      
    } catch (networkError) {
      console.log('🌐 Network error testing OAuth2:', networkError);
      
      return NextResponse.json({
        success: false,
        message: "❌ No se puede conectar al webhook OAuth2",
        error: networkError instanceof Error ? networkError.message : 'Network error',
        possible_causes: [
          "Workflow OAuth2 no está activo en n8n",
          "Webhook aún no está registrado (esperar 1-2 min)",
          "Error de conectividad con n8n"
        ],
        fallback_working: "Sistema híbrido con fallback sigue funcionando"
      }, { status: 500 });
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "❌ Error interno al testear OAuth2",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Endpoint para obtener Page Token específico
export async function PUT() {
  try {
    console.log('🔄 [PAGE TOKEN] Intentando obtener Page Token específico...');
    
    // Instrucciones para obtener Page Token manualmente
    // Ya que no podemos acceder directamente a las credenciales OAuth2 de n8n
    
    return NextResponse.json({
      message: "🔧 Instrucciones para obtener Page Token",
      steps: [
        {
          step: 1,
          title: "Obtener User Token actual",
          description: "Copia tu User Token desde n8n → Credentials → FB TOKEN"
        },
        {
          step: 2, 
          title: "Listar páginas disponibles",
          api_call: "GET https://graph.facebook.com/me/accounts",
          parameters: "?fields=name,access_token,id&access_token=TU_USER_TOKEN"
        },
        {
          step: 3,
          title: "Usar Page Token específico",
          description: "Copia el 'access_token' de la página donde quieres publicar",
          note: "Este Page Token nunca expira y tiene permisos específicos de página"
        },
        {
          step: 4,
          title: "Actualizar credenciales n8n",
          description: "Reemplaza User Token con Page Token en n8n",
          location: "n8n → Credentials → FB TOKEN → Access Token"
        }
      ],
      api_example: {
        url: "https://graph.facebook.com/me/accounts?fields=name,access_token,id",
        headers: {
          "Authorization": "Bearer TU_USER_TOKEN_ACTUAL"
        },
        expected_response: {
          data: [
            {
              name: "Tu Página de Facebook",
              access_token: "ESTE_ES_EL_PAGE_TOKEN_QUE_NECESITAS",
              id: "123456789"
            }
          ]
        }
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: "Error generando instrucciones Page Token",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}