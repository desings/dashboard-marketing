import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // URLs de n8n configuradas
    const n8nAccountWebhook = process.env.N8N_ACCOUNT_WEBHOOK;
    const n8nPublishWebhook = process.env.N8N_WEBHOOK_URL;
    
    console.log('🧪 [N8N Test] Verificando configuración...');
    console.log('📡 Account webhook:', n8nAccountWebhook);
    console.log('📡 Publish webhook:', n8nPublishWebhook);

    if (!n8nAccountWebhook || !n8nPublishWebhook) {
      return NextResponse.json(
        { 
          error: 'N8N webhooks no configurados',
          config: {
            account: !!n8nAccountWebhook,
            publish: !!n8nPublishWebhook
          }
        },
        { status: 503 }
      );
    }

    // Hacer una prueba simple al endpoint de account
    const testPayload = {
      tenantId: 'test_tenant_123',
      clientId: 'test_client_456',
      action: 'validate',
      platform: 'facebook',
      trigger: {
        source: 'dashboard-marketing',
        timestamp: new Date().toISOString(),
        requestId: `test_${Date.now()}`,
      }
    };

    console.log('🚀 [N8N Test] Enviando prueba a n8n...');

    const response = await fetch(n8nAccountWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'X-Dashboard-Auth': process.env.N8N_AUTH_TOKEN || 'dashboard-secret', // Comentado temporalmente
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    console.log('📥 [N8N Test] Respuesta de n8n:', response.status, responseText);

    let n8nResult;
    try {
      n8nResult = JSON.parse(responseText);
    } catch {
      n8nResult = responseText;
    }

    return NextResponse.json({
      success: response.ok,
      message: 'Prueba de conexión con n8n',
      config: {
        accountWebhook: n8nAccountWebhook,
        publishWebhook: n8nPublishWebhook,
      },
      test: {
        status: response.status,
        ok: response.ok,
        payload: testPayload,
        response: n8nResult
      }
    });

  } catch (error) {
    console.error('❌ [N8N Test] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error de conexión con n8n',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Usa GET para probar la conexión con n8n' });
}