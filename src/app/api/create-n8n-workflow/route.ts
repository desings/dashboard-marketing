import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const n8nApiUrl = process.env.N8N_API_URL || 'https://vmi2907616.contaboserver.net/api/v1';
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nApiKey) {
      return NextResponse.json(
        { error: 'N8N_API_KEY no configurada' },
        { status: 500 }
      );
    }

    console.log('🔧 [N8N AUTO] Creando workflow de Facebook automáticamente...');

    // Workflow definition
    const workflowData = {
      name: 'Facebook Publisher (Auto-Created)',
      settings: {},
      nodes: [
        {
          parameters: {
            httpMethod: 'POST',
            path: 'facebook-oauth2-publish',
            responseMode: 'responseNode',
            options: {}
          },
          id: 'webhook-node',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [240, 300]
        },
        {
          parameters: {
            jsCode: `// Procesar datos de publicación OAuth2
const data = $input.all();
const publishData = data[0].json;

console.log("📥 Facebook OAuth2 publish request:", publishData);

// Extraer mensaje
const message = publishData.content?.text || publishData.message || "Test post from Dashboard OAuth2";

// Configurar para páginas con OAuth2
// Nota: Las credenciales OAuth2 deben tener permisos:
// - pages_read_engagement
// - pages_manage_posts
// Y ser un Page Token, no User Token

return {
  message: message,
  // Para páginas específicas, cambiar 'me' por el Page ID
  // Ejemplo: facebook_page_id = "123456789012345"
  target: "me", 
  publish_data: publishData
};`
          },
          id: 'process-data',
          name: 'Process OAuth2 Data',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [400, 300]
        },
        {
          parameters: {
            method: 'POST',
            url: 'https://graph.facebook.com/v19.0/me/feed',
            sendBody: true,
            specifyBodyType: 'json',
            bodyParameters: {},
            jsonBody: '{{ { "message": $json.message } }}',
            authentication: 'predefinedCredentialType',
            nodeCredentialType: 'facebookGraphApi'
          },
          id: 'facebook-node',
          name: 'Facebook OAuth2 Post',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4,
          position: [560, 300],
          credentials: {
            facebookGraphApi: {
              name: 'FB TOKEN'
            }
          }
        },
      ],
      connections: {
        'Webhook': {
          main: [
            [
              {
                node: 'Facebook Post',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Facebook Post': {
          main: [
            [
              {
                node: 'Respond to Webhook',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };

    // Create workflow
    const createResponse = await fetch(`${n8nApiUrl}/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [N8N AUTO] Error creando workflow:', errorText);
      return NextResponse.json(
        { error: 'Error creando workflow', details: errorText },
        { status: createResponse.status }
      );
    }

    const workflow = await createResponse.json();
    console.log('✅ [N8N AUTO] Workflow creado:', workflow.id);

    // Activate workflow
    const activateResponse = await fetch(`${n8nApiUrl}/workflows/${workflow.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      console.log('⚠️ [N8N AUTO] Error activando workflow:', errorText);
    } else {
      console.log('✅ [N8N AUTO] Workflow activado exitosamente');
    }

    // Test the webhook
    const webhookUrl = `${process.env.N8N_BASE_URL}/webhook/facebook-publish-real`;
    console.log('🔍 [N8N AUTO] Probando webhook:', webhookUrl);

    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: { text: '✅ Auto-created workflow test' },
          message: 'Auto-created workflow test',
          test: true
        }),
        signal: AbortSignal.timeout(10000)
      });

      const testResult = await testResponse.json();
      console.log('🎯 [N8N AUTO] Test result:', testResult);

      return NextResponse.json({
        success: true,
        message: 'Workflow de Facebook creado y activado exitosamente',
        workflowId: workflow.id,
        workflowName: workflow.name,
        webhookUrl,
        testResult,
        active: true
      });

    } catch (testError) {
      console.log('⚠️ [N8N AUTO] Webhook test failed:', testError);
      return NextResponse.json({
        success: true,
        message: 'Workflow creado pero webhook aún no disponible (puede tardar unos segundos)',
        workflowId: workflow.id,
        workflowName: workflow.name,
        webhookUrl,
        note: 'Espera 30 segundos e intenta publicar'
      });
    }

  } catch (error) {
    console.error('❌ [N8N AUTO] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}