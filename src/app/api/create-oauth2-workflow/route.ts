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

    console.log('🔧 [N8N OAUTH2] Creando workflow de Facebook OAuth2 corregido...');

    // Workflow definition
    const workflowData = {
      name: 'Facebook OAuth2 Publisher (Fixed)',
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
          name: 'Webhook OAuth2',
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

// IMPORTANTE: El OAuth2 debe ser un PAGE TOKEN con permisos:
// - pages_read_engagement
// - pages_manage_posts
// No un User Token

return {
  message: message,
  facebook_target: "me", // Cambiar por Page ID si es necesario
  original_data: publishData
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
            jsonBody: '={{ { "message": $json.message } }}',
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
        {
          parameters: {
            respondWith: 'json',
            responseBody: '={{ { "success": true, "postId": $json.id || "published_oauth2", "message": "Published successfully via OAuth2", "timestamp": new Date().toISOString(), "platform": "facebook", "method": "oauth2" } }}'
          },
          id: 'response-success',
          name: 'OAuth2 Success Response',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [720, 200]
        },
        {
          parameters: {
            respondWith: 'json',
            responseBody: '={{ { "success": false, "error": "OAuth2 failed", "details": $json.error?.message || "Check FB TOKEN credentials and permissions (pages_read_engagement, pages_manage_posts)", "platform": "facebook", "method": "oauth2", "hint": "Ensure FB TOKEN is a Page Token, not User Token" } }}',
            options: {
              responseCode: 400
            }
          },
          id: 'response-error',
          name: 'OAuth2 Error Response',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [720, 400]
        }
      ],
      connections: {
        'Webhook OAuth2': {
          main: [
            [
              {
                node: 'Process OAuth2 Data',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Process OAuth2 Data': {
          main: [
            [
              {
                node: 'Facebook OAuth2 Post',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Facebook OAuth2 Post': {
          main: [
            [
              {
                node: 'OAuth2 Success Response',
                type: 'main',
                index: 0
              }
            ]
          ],
          error: [
            [
              {
                node: 'OAuth2 Error Response',
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
      console.error('❌ [N8N OAUTH2] Error creando workflow:', errorText);
      return NextResponse.json(
        { error: 'Error creando workflow', details: errorText },
        { status: createResponse.status }
      );
    }

    const workflow = await createResponse.json();
    console.log('✅ [N8N OAUTH2] Workflow creado:', workflow.id);

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
      console.log('⚠️ [N8N OAUTH2] Error activando workflow:', errorText);
    } else {
      console.log('✅ [N8N OAUTH2] Workflow activado exitosamente');
    }

    // Test the webhook
    const webhookUrl = `${process.env.N8N_BASE_URL}/webhook/facebook-oauth2-publish`;
    console.log('🔍 [N8N OAUTH2] Webhook disponible en:', webhookUrl);

    return NextResponse.json({
      success: true,
      message: 'Workflow OAuth2 de Facebook creado exitosamente',
      workflowId: workflow.id,
      workflowName: workflow.name,
      webhookUrl,
      instructions: [
        "1. Verifica que 'FB TOKEN' tenga permisos de página:",
        "   - pages_read_engagement",
        "   - pages_manage_posts",
        "2. Asegúrate de que sea un Page Token, no User Token",
        "3. Si publicas en página específica, cambia 'me' por Page ID"
      ],
      testUrl: webhookUrl,
      active: true
    });

  } catch (error) {
    console.error('❌ [N8N OAUTH2] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}