import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { isDatabaseAvailable } from '@/lib/database'

// Función para obtener userId del JWT  
function getUserId(req: Request): string {
  try {
    const cookie = req.headers.get("cookie") || "";
    const token = cookie.split("token=")[1]?.split(";")[0];
    if (!token) return "user-1";
    const payload: any = jwt.decode(token);
    return payload.sub;
  } catch {
    return "user-1"; // Usuario temporal
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    console.log("UserId en clientes:", userId);

    // ✅ MODO PRODUCCIÓN: Usar base de datos real
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      try {
        const { getSupabaseClient } = await import('@/lib/database')
        const supabase = getSupabaseClient()
        
        // Usar Supabase para obtener clientes reales
        const { data: clients, error } = await supabase
          .from('user_tenants')
          .select(`
            *,
            tenant:tenants(
              *,
              social_accounts(*)
            )
          `)
          .eq('user_id', userId)
        
        if (error) {
          console.warn('⚠️ Error en Supabase:', error)
          throw error
        }

        const formattedClients = clients?.map(relation => ({
          tenant: relation.tenant,
          socialAccounts: relation.tenant?.social_accounts || []
        })) || []

        return NextResponse.json({ 
          clients: formattedClients,
          total: formattedClients.length,
          production: true
        });
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos:', dbError);
      }
    }
    
    // Fallback: datos demo si no hay conexión
    console.log('🔄 Fallback a modo demo');
    return NextResponse.json({ 
      clients: [],
      message: '⚠️ Conectando a base de datos...',
      demo: true
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    
    console.log('� POST clientes - Modo producción');
    
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      try {
        const { getSupabaseClient } = await import('@/lib/database')
        const supabase = getSupabaseClient()
        
        // Crear nuevo tenant en Supabase
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: body.name,
            logo_url: body.logoUrl || null
          })
          .select()
          .single()
        
        if (tenantError) {
          console.error('❌ Error creando tenant:', tenantError)
          throw tenantError
        }
        
        // Crear relación usuario-tenant
        const { error: relationError } = await supabase
          .from('user_tenants')
          .insert({
            user_id: userId,
            tenant_id: newTenant.id,
            role: 'owner'
          })
        
        if (relationError) {
          console.error('❌ Error creando relación:', relationError)
          throw relationError
        }
        
        return NextResponse.json({
          success: true,
          tenant: newTenant,
          production: true
        });
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos:', dbError);
        return NextResponse.json({
          success: false,
          error: 'Error creando cliente: ' + (dbError as Error).message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Base de datos no disponible',
      demo: true
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const { tenantId } = body;
    
    console.log('✏️ PUT clientes - Modo producción');
    
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      try {
        const { getSupabaseClient } = await import('@/lib/database')
        const supabase = getSupabaseClient()
        
        // Actualizar tenant en Supabase
        const { data: updatedTenant, error } = await supabase
          .from('tenants')
          .update({
            name: body.name,
            logo_url: body.logoUrl || null
          })
          .eq('id', tenantId)
          .select()
          .single()
        
        if (error) {
          console.error('❌ Error actualizando tenant:', error)
          throw error
        }
        
        return NextResponse.json({
          success: true,
          tenant: updatedTenant,
          production: true
        });
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos:', dbError);
        return NextResponse.json({
          success: false,
          error: 'Error actualizando cliente: ' + (dbError as Error).message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Base de datos no disponible',
      demo: true
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    
    console.log('🗑️ DELETE clientes - Modo producción');
    
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });
    }
    
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      try {
        const { getSupabaseClient } = await import('@/lib/database')
        const supabase = getSupabaseClient()
        
        // Eliminar relación usuario-tenant primero
        const { error: relationError } = await supabase
          .from('user_tenants')
          .delete()
          .eq('user_id', userId)
          .eq('tenant_id', tenantId)
        
        if (relationError) {
          console.error('❌ Error eliminando relación:', relationError)
          throw relationError
        }
        
        // Eliminar tenant
        const { error: tenantError } = await supabase
          .from('tenants')
          .delete()
          .eq('id', tenantId)
        
        if (tenantError) {
          console.error('❌ Error eliminando tenant:', tenantError)
          throw tenantError
        }
        
        return NextResponse.json({
          success: true,
          production: true
        });
      } catch (dbError) {
        console.warn('⚠️ Error en base de datos:', dbError);
        return NextResponse.json({
          success: false,
          error: 'Error eliminando cliente: ' + (dbError as Error).message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Base de datos no disponible',
      demo: true
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}