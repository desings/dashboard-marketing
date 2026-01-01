import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Configuración OAuth2 de Facebook",
    steps: [
      {
        step: 1,
        title: "Workflow Creado",
        description: "El workflow 'Facebook Publisher (Auto-Created)' ha sido creado en n8n",
        status: "✅ Completado",
        details: "ID: 92kBvdLemTsrTyxV"
      },
      {
        step: 2,
        title: "Activación Manual Requerida",
        description: "Ve a n8n y activa manualmente el workflow",
        status: "⚠️ Acción requerida",
        action: {
          url: "https://vmi2907616.contaboserver.net/workflows/92kBvdLemTsrTyxV",
          description: "Abre este enlace y haz clic en el botón 'Active' en la esquina superior derecha"
        }
      },
      {
        step: 3,
        title: "Verificar Credenciales",
        description: "Asegúrate de que 'FB TOKEN' esté configurado correctamente",
        status: "ℹ️ Verificar",
        details: "Debe ser una credencial OAuth2 de Facebook con permisos de publicación"
      }
    ],
    webhookUrl: "https://vmi2907616.contaboserver.net/webhook/facebook-publish-real",
    testEndpoint: "/api/publish-via-n8n",
    note: "Una vez activado manualmente, el sistema OAuth2 funcionará automáticamente"
  });
}

export async function POST() {
  try {
    // Probar si el webhook está activo
    const N8N_BASE_URL = process.env.N8N_BASE_URL;
    const webhookUrl = `${N8N_BASE_URL}/webhook/facebook-publish-real`;

    const testResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: { text: '✅ Test OAuth2 setup - ' + new Date().toISOString() },
        message: 'OAuth2 setup test',
        test: true
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: "✅ OAuth2 Facebook está funcionando correctamente",
        testResult: result,
        webhookStatus: "Activo y funcionando"
      });
    } else {
      const errorText = await testResponse.text();
      return NextResponse.json({
        success: false,
        message: "❌ Webhook aún no está activo",
        error: errorText,
        instructions: "Ve a n8n y activa manualmente el workflow 'Facebook Publisher (Auto-Created)'"
      }, { status: 503 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Error al probar el webhook OAuth2",
      error: error instanceof Error ? error.message : 'Unknown error',
      instructions: "Verifica que n8n esté funcionando y el workflow esté activo"
    }, { status: 500 });
  }
}