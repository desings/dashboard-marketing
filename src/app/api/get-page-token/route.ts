import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "🔧 Herramienta Page Token para OAuth2",
    instruction: "Necesitas obtener un Page Token para que OAuth2 funcione con páginas de Facebook",
    steps: [
      {
        step: 1,
        title: "Obtén tu User Token actual",
        description: "Ve a n8n → Credentials → FB TOKEN y copia el access_token"
      },
      {
        step: 2,
        title: "Usa esta herramienta",
        method: "POST /api/get-page-token",
        body: { user_token: "TU_USER_TOKEN_DE_N8N" }
      },
      {
        step: 3,
        title: "Reemplaza en n8n",
        description: "Usa el Page Token devuelto para actualizar tus credenciales"
      }
    ]
  });
}

export async function POST(req: Request) {
  try {
    const { user_token } = await req.json();

    if (!user_token) {
      return NextResponse.json({
        error: "user_token requerido",
        help: "Proporciona tu User Token actual de n8n"
      }, { status: 400 });
    }

    console.log('🔄 [PAGE TOKEN] Obteniendo páginas y Page Tokens...');

    // Obtener páginas disponibles con el User Token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/me/accounts?fields=name,access_token,id,category&access_token=${user_token}`
    );

    if (!pagesResponse.ok) {
      const error = await pagesResponse.text();
      console.error('❌ Error obteniendo páginas:', error);
      
      return NextResponse.json({
        error: "Error obteniendo páginas de Facebook",
        details: error,
        possible_causes: [
          "User Token inválido o expirado",
          "Falta permiso pages_read_engagement",
          "Token no tiene acceso a páginas"
        ]
      }, { status: 400 });
    }

    const pagesData = await pagesResponse.json();
    console.log('✅ [PAGE TOKEN] Páginas obtenidas:', pagesData.data?.length || 0);

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({
        error: "No se encontraron páginas",
        message: "Tu cuenta no tiene páginas de Facebook o el token no tiene permisos",
        solution: [
          "Crear una página de Facebook",
          "Verificar permisos pages_read_engagement",
          "Asegurar que el token tenga acceso a páginas"
        ]
      }, { status: 404 });
    }

    // Formatear respuesta con Page Tokens
    const pageTokens = pagesData.data.map((page: any) => ({
      name: page.name,
      id: page.id,
      category: page.category,
      page_token: page.access_token,
      instructions: {
        usage: "Reemplaza el User Token en n8n con este Page Token",
        location: "n8n → Credentials → FB TOKEN → Access Token",
        note: "Este Page Token nunca expira y tiene permisos específicos de página"
      }
    }));

    return NextResponse.json({
      success: true,
      message: `✅ Encontradas ${pageTokens.length} páginas con Page Tokens`,
      user_token_valid: true,
      pages: pageTokens,
      next_steps: [
        "1. Elige la página donde quieres publicar",
        "2. Copia su 'page_token'", 
        "3. Ve a n8n → Credentials → FB TOKEN",
        "4. Reemplaza el User Token con el Page Token",
        "5. Guarda y prueba la publicación OAuth2"
      ],
      important_note: "Page Tokens nunca expiran y resuelven el problema de permisos"
    });

  } catch (error) {
    console.error('❌ [PAGE TOKEN] Error:', error);
    return NextResponse.json({
      error: "Error procesando solicitud",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { page_token } = await req.json();

    if (!page_token) {
      return NextResponse.json({
        error: "page_token requerido",
        help: "Proporciona el Page Token para verificar"
      }, { status: 400 });
    }

    console.log('🧪 [PAGE TOKEN] Verificando Page Token...');

    // Verificar que el Page Token funciona para publicación
    const tokenTestResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,category,access_token&access_token=${page_token}`
    );

    if (!tokenTestResponse.ok) {
      const error = await tokenTestResponse.text();
      return NextResponse.json({
        error: "Page Token inválido",
        details: error
      }, { status: 400 });
    }

    const tokenData = await tokenTestResponse.json();

    // Verificar permisos específicos
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/me/permissions?access_token=${page_token}`
    );

    let permissions = [];
    if (permissionsResponse.ok) {
      const permData = await permissionsResponse.json();
      permissions = permData.data?.map((p: any) => ({
        permission: p.permission,
        status: p.status
      })) || [];
    }

    return NextResponse.json({
      success: true,
      message: "✅ Page Token validado exitosamente",
      page_info: {
        id: tokenData.id,
        name: tokenData.name,
        category: tokenData.category || 'Unknown'
      },
      permissions_found: permissions,
      can_publish: permissions.some((p: any) => 
        (p.permission === 'pages_manage_posts' || p.permission === 'publish_pages') && 
        p.status === 'granted'
      ),
      ready_for_n8n: "Este Page Token está listo para usar en n8n"
    });

  } catch (error) {
    return NextResponse.json({
      error: "Error verificando Page Token",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}