import { TokenManager } from './token-manager'
import { SocialAccount } from './supabase'

export class SocialMediaPublisher {
  
  /**
   * Publica contenido en múltiples plataformas asegurando tokens válidos
   */
  static async publishToMultiplePlatforms(
    accountIds: string[],
    content: {
      text: string
      media_urls?: string[]
      link_url?: string
    }
  ): Promise<{
    success: boolean
    results: Array<{
      account_id: string
      provider: string
      account_name?: string
      success: boolean
      post_id?: string
      post_url?: string
      error?: string
    }>
  }> {
    const results = []

    for (const accountId of accountIds) {
      const result = await this.publishToSinglePlatform(accountId, content)
      results.push(result)
    }

    const successfulPublications = results.filter(r => r.success).length
    
    return {
      success: successfulPublications > 0,
      results
    }
  }

  /**
   * Publica contenido en una plataforma específica
   */
  static async publishToSinglePlatform(
    accountId: string,
    content: {
      text: string
      media_urls?: string[]
      link_url?: string
    }
  ): Promise<{
    account_id: string
    provider: string
    account_name?: string
    success: boolean
    post_id?: string
    post_url?: string
    error?: string
  }> {
    
    try {
      // Obtener cuenta válida con token renovado si es necesario
      const account = await TokenManager.getValidSocialAccount(accountId)
      
      if (!account) {
        return {
          account_id: accountId,
          provider: 'unknown',
          success: false,
          error: 'Cuenta no válida o token expirado. Requiere reautenticación.'
        }
      }

      // Publicar según el proveedor
      let publishResult: { success: boolean; post_id?: string; post_url?: string; error?: string }

      switch (account.provider) {
        case 'facebook':
          publishResult = await this.publishToFacebook(account, content)
          break
        case 'instagram':
          publishResult = await this.publishToInstagram(account, content)
          break
        case 'google':
          publishResult = await this.publishToGoogle(account, content)
          break
        case 'pinterest':
          publishResult = await this.publishToPinterest(account, content)
          break
        default:
          publishResult = {
            success: false,
            error: `Proveedor ${account.provider} no soportado`
          }
      }

      return {
        account_id: accountId,
        provider: account.provider,
        account_name: account.provider_account_name,
        ...publishResult
      }

    } catch (error) {
      console.error(`Error publicando en cuenta ${accountId}:`, error)
      
      return {
        account_id: accountId,
        provider: 'unknown',
        success: false,
        error: `Error interno: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error'}`
      }
    }
  }

  /**
   * Publica en Facebook
   */
  static async publishToFacebook(
    account: SocialAccount,
    content: {
      text: string
      media_urls?: string[]
      link_url?: string
    }
  ): Promise<{ success: boolean; post_id?: string; post_url?: string; error?: string }> {
    
    try {
      // Determinar el endpoint (página o perfil personal)
      const isPage = account.account_type === 'page'
      const endpoint = isPage 
        ? `https://graph.facebook.com/v19.0/${account.provider_account_id}/feed`
        : `https://graph.facebook.com/v19.0/me/feed`

      const postData: any = {
        message: content.text,
        access_token: account.access_token
      }

      // Añadir enlace si existe
      if (content.link_url) {
        postData.link = content.link_url
      }

      // Manejar medios (fotos)
      if (content.media_urls && content.media_urls.length > 0) {
        // Para medios, usar endpoint de photos
        const photoEndpoint = isPage 
          ? `https://graph.facebook.com/v19.0/${account.provider_account_id}/photos`
          : `https://graph.facebook.com/v19.0/me/photos`

        const mediaResponse = await fetch(photoEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: content.media_urls[0], // Primera imagen
            caption: content.text,
            access_token: account.access_token
          })
        })

        const mediaData = await mediaResponse.json()

        if (!mediaResponse.ok || mediaData.error) {
          return {
            success: false,
            error: `Error publicando media: ${mediaData.error?.message || 'Unknown error'}`
          }
        }

        return {
          success: true,
          post_id: mediaData.id,
          post_url: `https://facebook.com/${mediaData.id}`
        }
      }

      // Publicación de texto/enlace
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        // Si hay error 401/403, marcar cuenta como expirada
        if (response.status === 401 || response.status === 403) {
          await TokenManager.markAccountAsExpired(
            account.id,
            `Error de autenticación: ${data.error?.message || 'Token inválido'}`
          )
        }
        
        return {
          success: false,
          error: data.error?.message || `Error HTTP ${response.status}`
        }
      }

      return {
        success: true,
        post_id: data.id,
        post_url: `https://facebook.com/${data.id}`
      }

    } catch (error) {
      console.error('Error en Facebook publish:', error)
      return {
        success: false,
        error: `Error de red: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    }
  }

  /**
   * Publica en Instagram
   */
  static async publishToInstagram(
    account: SocialAccount,
    content: {
      text: string
      media_urls?: string[]
      link_url?: string
    }
  ): Promise<{ success: boolean; post_id?: string; post_url?: string; error?: string }> {
    
    try {
      // Instagram requiere medios para posts
      if (!content.media_urls || content.media_urls.length === 0) {
        return {
          success: false,
          error: 'Instagram requiere al menos una imagen para publicar'
        }
      }

      // Crear contenedor de media
      const containerResponse = await fetch(
        `https://graph.facebook.com/v19.0/${account.provider_account_id}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: content.media_urls[0],
            caption: content.text,
            access_token: account.access_token
          })
        }
      )

      const containerData = await containerResponse.json()

      if (!containerResponse.ok || containerData.error) {
        return {
          success: false,
          error: `Error creando contenedor: ${containerData.error?.message || 'Unknown error'}`
        }
      }

      // Publicar el contenedor
      const publishResponse = await fetch(
        `https://graph.facebook.com/v19.0/${account.provider_account_id}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: account.access_token
          })
        }
      )

      const publishData = await publishResponse.json()

      if (!publishResponse.ok || publishData.error) {
        if (publishResponse.status === 401 || publishResponse.status === 403) {
          await TokenManager.markAccountAsExpired(
            account.id,
            `Error de autenticación: ${publishData.error?.message || 'Token inválido'}`
          )
        }

        return {
          success: false,
          error: publishData.error?.message || `Error HTTP ${publishResponse.status}`
        }
      }

      return {
        success: true,
        post_id: publishData.id,
        post_url: `https://instagram.com/p/${publishData.id}/`
      }

    } catch (error) {
      console.error('Error en Instagram publish:', error)
      return {
        success: false,
        error: `Error de red: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    }
  }

  /**
   * Publica en Google (YouTube o Google My Business)
   */
  static async publishToGoogle(
    account: SocialAccount,
    content: {
      text: string
      media_urls?: string[]
      link_url?: string
    }
  ): Promise<{ success: boolean; post_id?: string; post_url?: string; error?: string }> {
    
    return {
      success: false,
      error: 'Publicación en Google no implementada aún'
    }
  }

  /**
   * Publica en Pinterest
   */
  static async publishToPinterest(
    account: SocialAccount,
    content: {
      text: string
      media_urls?: string[]
      link_url?: string
    }
  ): Promise<{ success: boolean; post_id?: string; post_url?: string; error?: string }> {
    
    try {
      // Pinterest requiere imagen
      if (!content.media_urls || content.media_urls.length === 0) {
        return {
          success: false,
          error: 'Pinterest requiere al menos una imagen para crear un pin'
        }
      }

      const pinData: any = {
        title: content.text.substring(0, 100), // Pinterest limita título
        description: content.text,
        media_source: {
          source_type: 'image_url',
          url: content.media_urls[0]
        }
      }

      // Añadir enlace si existe
      if (content.link_url) {
        pinData['link'] = content.link_url
      }

      const response = await fetch(
        'https://api.pinterest.com/v5/pins',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pinData)
        }
      )

      const data = await response.json()

      if (!response.ok || data.error) {
        if (response.status === 401 || response.status === 403) {
          await TokenManager.markAccountAsExpired(
            account.id,
            `Error de autenticación: ${data.error?.message || 'Token inválido'}`
          )
        }

        return {
          success: false,
          error: data.error?.message || `Error HTTP ${response.status}`
        }
      }

      return {
        success: true,
        post_id: data.id,
        post_url: `https://pinterest.com/pin/${data.id}/`
      }

    } catch (error) {
      console.error('Error en Pinterest publish:', error)
      return {
        success: false,
        error: `Error de red: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    }
  }

  /**
   * Obtiene estadísticas de una publicación
   */
  static async getPostStats(accountId: string, postId: string): Promise<{
    success: boolean
    stats?: {
      likes?: number
      shares?: number
      comments?: number
      views?: number
    }
    error?: string
  }> {
    
    try {
      const account = await TokenManager.getValidSocialAccount(accountId)
      
      if (!account) {
        return { success: false, error: 'Cuenta no válida' }
      }

      switch (account.provider) {
        case 'facebook':
          return await this.getFacebookStats(account, postId)
        case 'instagram':
          return await this.getInstagramStats(account, postId)
        default:
          return { success: false, error: 'Estadísticas no disponibles para este proveedor' }
      }

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Obtiene estadísticas de Facebook
   */
  static async getFacebookStats(account: SocialAccount, postId: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${postId}?fields=likes.summary(total_count),shares,comments.summary(total_count)&access_token=${account.access_token}`
      )

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error?.message }
      }

      return {
        success: true,
        stats: {
          likes: data.likes?.summary?.total_count || 0,
          shares: data.shares?.count || 0,
          comments: data.comments?.summary?.total_count || 0
        }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Obtiene estadísticas de Instagram
   */
  static async getInstagramStats(account: SocialAccount, postId: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${postId}/insights?metric=likes,comments,shares&access_token=${account.access_token}`
      )

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error?.message }
      }

      const stats: any = {}
      data.data?.forEach((metric: any) => {
        stats[metric.name] = metric.values?.[0]?.value || 0
      })

      return { success: true, stats }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}