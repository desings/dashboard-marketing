import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id es requerido' },
        { status: 400 }
      )
    }

    // Si Supabase no está configurado, devolver array vacío para permitir conexiones
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        accounts: []
      })
    }

    // Obtener todas las cuentas sociales del usuario
    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo cuentas sociales:', error)
      return NextResponse.json(
        { error: 'Error obteniendo cuentas sociales' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      accounts: (accounts || []).map(account => ({
        id: account.id,
        provider: account.provider,
        provider_account_name: account.provider_account_name,
        account_type: account.account_type,
        status: account.status,
        scopes: account.scopes,
        expires_at: account.expires_at,
        last_used_at: account.last_used_at,
        created_at: account.created_at,
        error_message: account.error_message
      }))
    })

  } catch (error) {
    console.error('Error en social-accounts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id es requerido' },
        { status: 400 }
      )
    }

    // Si Supabase no está configurado, simular éxito
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: true, 
        message: 'Simulación: cuenta eliminada (Supabase no configurado)' 
      })
    }

    // Eliminar cuenta social
    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', accountId)

    if (error) {
      console.error('Error eliminando cuenta social:', error)
      return NextResponse.json(
        { error: 'Error eliminando cuenta social' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error en DELETE social-accounts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { account_id } = await request.json()

    if (!account_id) {
      return NextResponse.json(
        { error: 'account_id es requerido' },
        { status: 400 }
      )
    }

    // Si Supabase no está configurado, simular renovación
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'Simulación: Supabase no configurado. Configure las variables de entorno.'
      })
    }

    // En un escenario real, aquí iría la lógica de renovación con TokenManager
    return NextResponse.json({
      success: false,
      message: 'Renovación no implementada aún. Configure TokenManager.'
    })

  } catch (error) {
    console.error('Error en POST social-accounts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}