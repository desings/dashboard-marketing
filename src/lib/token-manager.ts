import { supabase, SocialAccount, OAuthConfiguration } from './supabase'

export class TokenManager {
  /**
   * Verifica si un token está caducado o próximo a caducar (15 minutos)
   */
  static isTokenExpired(expiresAt: string): boolean {
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    const buffer = 15 * 60 * 1000 // 15 minutos en ms
    
    return expirationDate.getTime() <= (now.getTime() + buffer)
  }

  /**
   * Obtiene una cuenta social válida, renovando el token si es necesario
   */
  static async getValidSocialAccount(accountId: string): Promise<SocialAccount | null> {
    const { data: account, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('status', 'active')
      .single()

    if (error || !account) {
      console.error('Error obteniendo cuenta social:', error)
      return null
    }

    // Si el token no está caducado, devolverlo directamente
    if (!this.isTokenExpired(account.expires_at)) {
      await this.updateLastUsed(accountId)
      return account
    }

    // Intentar renovar el token
    const renewedAccount = await this.renewToken(account)
    if (renewedAccount) {
      await this.updateLastUsed(accountId)
      return renewedAccount
    }

    // Marcar cuenta como expirada si la renovación falló
    await this.markAccountAsExpired(accountId, 'No se pudo renovar el token')
    return null
  }

  /**
   * Renueva el token según el proveedor
   */
  static async renewToken(account: SocialAccount): Promise<SocialAccount | null> {
    try {
      switch (account.provider) {
        case 'facebook':
        case 'instagram':
          return await this.renewFacebookToken(account)
        
        case 'google':
          return await this.renewGoogleToken(account)
        
        case 'pinterest':
          return await this.renewPinterestToken(account)
        
        default:
          console.error(`Proveedor no soportado: ${account.provider}`)
          return null
      }
    } catch (error) {
      console.error(`Error renovando token para ${account.provider}:`, error)
      return null
    }
  }

  /**
   * Renueva token de Facebook/Instagram (long-lived token)
   */
  static async renewFacebookToken(account: SocialAccount): Promise<SocialAccount | null> {
    const config = await this.getOAuthConfig(account.provider)
    if (!config) return null

    try {
      // Usar long-lived token si está disponible, si no el access_token actual
      const tokenToExtend = account.long_lived_token || account.access_token
      
      const response = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${config.client_id}&` +
        `client_secret=${config.client_secret}&` +
        `fb_exchange_token=${tokenToExtend}`
      )

      const data = await response.json()

      if (!response.ok || data.error) {
        console.error('Error renovando token Facebook:', data.error)
        return null
      }

      // Calcular nueva fecha de expiración (60 días para long-lived tokens)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)

      // Actualizar en Supabase
      const { data: updatedAccount, error } = await supabase
        .from('social_accounts')
        .update({
          access_token: data.access_token,
          long_lived_token: data.access_token,
          expires_at: expiresAt.toISOString(),
          status: 'active',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando token en DB:', error)
        return null
      }

      return updatedAccount
    } catch (error) {
      console.error('Error en renovación Facebook:', error)
      return null
    }
  }

  /**
   * Renueva token de Google usando refresh token
   */
  static async renewGoogleToken(account: SocialAccount): Promise<SocialAccount | null> {
    if (!account.refresh_token) {
      console.error('No hay refresh token para Google')
      return null
    }

    const config = await this.getOAuthConfig(account.provider)
    if (!config) return null

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
          client_id: config.client_id,
          client_secret: config.client_secret
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        console.error('Error renovando token Google:', data.error)
        return null
      }

      // Calcular nueva fecha de expiración
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in)

      // Actualizar en Supabase
      const { data: updatedAccount, error } = await supabase
        .from('social_accounts')
        .update({
          access_token: data.access_token,
          expires_at: expiresAt.toISOString(),
          status: 'active',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando token en DB:', error)
        return null
      }

      return updatedAccount
    } catch (error) {
      console.error('Error en renovación Google:', error)
      return null
    }
  }

  /**
   * Renueva token de Pinterest usando refresh token
   */
  static async renewPinterestToken(account: SocialAccount): Promise<SocialAccount | null> {
    if (!account.refresh_token) {
      console.error('No hay refresh token para Pinterest')
      return null
    }

    const config = await this.getOAuthConfig(account.provider)
    if (!config) return null

    try {
      const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
          client_id: config.client_id,
          client_secret: config.client_secret
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        console.error('Error renovando token Pinterest:', data.error)
        return null
      }

      // Calcular nueva fecha de expiración
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in)

      // Actualizar en Supabase
      const { data: updatedAccount, error } = await supabase
        .from('social_accounts')
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token, // Pinterest puede devolver nuevo refresh token
          expires_at: expiresAt.toISOString(),
          status: 'active',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando token en DB:', error)
        return null
      }

      return updatedAccount
    } catch (error) {
      console.error('Error en renovación Pinterest:', error)
      return null
    }
  }

  /**
   * Obtiene configuración OAuth para un proveedor
   */
  static async getOAuthConfig(provider: string): Promise<OAuthConfiguration | null> {
    const { data, error } = await supabase
      .from('oauth_configurations')
      .select('*')
      .eq('provider', provider)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error(`Error obteniendo config OAuth para ${provider}:`, error)
      return null
    }

    return data
  }

  /**
   * Actualiza la última vez que se usó una cuenta
   */
  static async updateLastUsed(accountId: string): Promise<void> {
    await supabase
      .from('social_accounts')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', accountId)
  }

  /**
   * Marca una cuenta como expirada
   */
  static async markAccountAsExpired(accountId: string, errorMessage: string): Promise<void> {
    await supabase
      .from('social_accounts')
      .update({
        status: 'expired',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
  }

  /**
   * Obtiene todas las cuentas de un usuario que necesitan reautenticación
   */
  static async getExpiredAccounts(userId: string): Promise<SocialAccount[]> {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['expired', 'error'])

    if (error) {
      console.error('Error obteniendo cuentas expiradas:', error)
      return []
    }

    return data || []
  }
}