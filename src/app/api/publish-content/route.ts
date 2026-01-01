import { NextRequest, NextResponse } from 'next/server'
import { SocialMediaPublisher } from '@/lib/social-publisher'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      account_ids, 
      content, 
      scheduled_for,
      user_id 
    } = body

    // Validaciones básicas
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id es requerido' },
        { status: 400 }
      )
    }

    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      return NextResponse.json(
        { error: 'account_ids debe ser un array con al menos una cuenta' },
        { status: 400 }
      )
    }

    if (!content || !content.text) {
      return NextResponse.json(
        { error: 'content.text es requerido' },
        { status: 400 }
      )
    }

    // Verificar que las cuentas pertenecen al usuario
    const { data: userAccounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('user_id', user_id)
      .in('id', account_ids)

    if (accountsError) {
      console.error('Error verificando cuentas:', accountsError)
      return NextResponse.json(
        { error: 'Error verificando permisos de cuentas' },
        { status: 500 }
      )
    }

    const validAccountIds = userAccounts.map(acc => acc.id)
    const invalidAccountIds = account_ids.filter(id => !validAccountIds.includes(id))

    if (invalidAccountIds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Algunas cuentas no pertenecen al usuario o no existen',
          invalid_accounts: invalidAccountIds
        },
        { status: 403 }
      )
    }

    // Determinar si es publicación inmediata o programada
    const isScheduled = scheduled_for && new Date(scheduled_for) > new Date()

    if (isScheduled) {
      // Guardar como publicación programada
      const { data: scheduledPost, error: scheduleError } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id,
          content: content.text,
          media_urls: content.media_urls,
          scheduled_for
        })
        .select()
        .single()

      if (scheduleError) {
        console.error('Error creando post programado:', scheduleError)
        return NextResponse.json(
          { error: 'Error programando publicación' },
          { status: 500 }
        )
      }

      // Crear registros de publicación para cada cuenta
      const publications = account_ids.map(account_id => ({
        scheduled_post_id: scheduledPost.id,
        social_account_id: account_id,
        status: 'pending' as const
      }))

      const { error: publicationsError } = await supabase
        .from('post_publications')
        .insert(publications)

      if (publicationsError) {
        console.error('Error creando publicaciones:', publicationsError)
        return NextResponse.json(
          { error: 'Error configurando publicaciones programadas' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        scheduled_post_id: scheduledPost.id,
        message: `Publicación programada para ${new Date(scheduled_for).toLocaleString('es-ES')}`,
        accounts_count: account_ids.length
      })

    } else {
      // Publicar inmediatamente
      const publishResult = await SocialMediaPublisher.publishToMultiplePlatforms(
        account_ids,
        content
      )

      // Guardar registro del post (aunque sea inmediato)
      const { data: scheduledPost, error: scheduleError } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id,
          content: content.text,
          media_urls: content.media_urls,
          scheduled_for: new Date().toISOString(),
          status: publishResult.success ? 'published' : 'failed'
        })
        .select()
        .single()

      if (!scheduleError && scheduledPost) {
        // Guardar resultados de cada publicación
        const publications = publishResult.results.map(result => ({
          scheduled_post_id: scheduledPost.id,
          social_account_id: result.account_id,
          platform_post_id: result.post_id,
          platform_url: result.post_url,
          status: result.success ? 'published' as const : 'failed' as const,
          error_message: result.error,
          published_at: result.success ? new Date().toISOString() : undefined
        }))

        await supabase
          .from('post_publications')
          .insert(publications)
      }

      return NextResponse.json({
        success: publishResult.success,
        results: publishResult.results,
        scheduled_post_id: scheduledPost?.id,
        message: publishResult.success 
          ? `Publicado exitosamente en ${publishResult.results.filter(r => r.success).length} de ${publishResult.results.length} cuentas`
          : 'Error publicando en todas las cuentas'
      })
    }

  } catch (error) {
    console.error('Error en publish-content:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}