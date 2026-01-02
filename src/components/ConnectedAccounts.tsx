'use client'

import React, { useState, useEffect } from 'react'

interface SocialAccount {
  id: string
  provider: 'facebook' | 'instagram' | 'google' | 'pinterest'
  provider_account_name?: string
  account_type?: string
  status: 'active' | 'expired' | 'error' | 'revoked'
  scopes: string[]
  expires_at: string
  last_used_at?: string
  created_at: string
  error_message?: string
}

interface ConnectedAccountsProps {
  userId: string
}

const PROVIDER_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram', 
  google: 'Google',
  pinterest: 'Pinterest'
}

const PROVIDER_ICONS = {
  facebook: <i className="fab fa-facebook text-blue-600"></i>,
  instagram: <i className="fab fa-instagram text-pink-500"></i>,
  google: <i className="fab fa-google text-red-500"></i>,
  pinterest: <i className="fab fa-pinterest text-red-600"></i>
}

const STATUS_LABELS = {
  active: 'Conectado',
  expired: 'Reautenticar',
  error: 'Error',
  revoked: 'Revocado'
}

const STATUS_COLORS = {
  active: 'text-green-600 bg-green-50 border-green-200',
  expired: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  revoked: 'text-gray-600 bg-gray-50 border-gray-200'
}

export default function ConnectedAccounts({ userId }: ConnectedAccountsProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  useEffect(() => {
    loadAccounts()
    
    // Revisar parámetros de URL para mostrar mensajes de OAuth
    const urlParams = new URLSearchParams(window.location.search)
    const oauthError = urlParams.get('oauth_error')
    const provider = urlParams.get('provider')
    const message = urlParams.get('message')
    
    if (oauthError && message) {
      alert(`Error OAuth ${provider}: ${decodeURIComponent(message)}`)
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    const oauthSuccess = urlParams.get('oauth_success')
    const account = urlParams.get('account')
    const accountData = urlParams.get('account_data')
    
    if (oauthSuccess && account) {
      alert(`Éxito: Cuenta ${oauthSuccess} conectada: ${decodeURIComponent(account)}`)
      
      // Guardar cuenta en localStorage si tenemos los datos
      if (accountData) {
        try {
          const parsedAccount = JSON.parse(decodeURIComponent(accountData))
          const existingAccounts = JSON.parse(localStorage.getItem('connected_accounts') || '[]')
          const updatedAccounts = existingAccounts.filter((acc: any) => acc.provider !== parsedAccount.provider)
          updatedAccounts.push(parsedAccount)
          localStorage.setItem('connected_accounts', JSON.stringify(updatedAccounts))
        } catch (error) {
          console.error('Error saving account to localStorage:', error)
        }
      }
      
      // Limpiar URL y recargar cuentas
      window.history.replaceState({}, document.title, window.location.pathname)
      setTimeout(loadAccounts, 1000)
    }
  }, [userId])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social-accounts?user_id=${userId}`)
      const data = await response.json()

      let accounts = []
      
      if (response.ok) {
        accounts = data.accounts || []
      } else {
        console.error('Error cargando cuentas:', data.error)
      }
      
      // Si no hay cuentas del servidor, cargar desde localStorage como fallback
      if (accounts.length === 0) {
        try {
          const localAccounts = JSON.parse(localStorage.getItem('connected_accounts') || '[]')
          accounts = localAccounts
        } catch (error) {
          console.error('Error loading from localStorage:', error)
        }
      }
      
      setAccounts(accounts)
    } catch (error) {
      console.error('Error:', error)
      // Fallback a localStorage si falla la API
      try {
        const localAccounts = JSON.parse(localStorage.getItem('connected_accounts') || '[]')
        setAccounts(localAccounts)
      } catch (localError) {
        console.error('Error loading from localStorage:', localError)
      }
    } finally {
      setLoading(false)
    }
  }

  const connectAccount = async (provider: string) => {
    try {
      setConnecting(provider)
      
      // Redirigir al flujo OAuth
      window.location.href = `/api/oauth/${provider}/connect?user_id=${userId}`
    } catch (error) {
      console.error('Error iniciando conexión:', error)
      setConnecting(null)
    }
  }

  const refreshToken = async (accountId: string) => {
    try {
      setRefreshing(accountId)
      
      const response = await fetch('/api/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId })
      })

      const data = await response.json()

      if (data.success) {
        await loadAccounts() // Recargar cuentas
      } else {
        alert(data.message || 'Error renovando token')
      }
    } catch (error) {
      console.error('Error renovando token:', error)
      alert('Error renovando token')
    } finally {
      setRefreshing(null)
    }
  }

  const disconnectAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`¿Estás seguro de que quieres desconectar ${accountName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/social-accounts?account_id=${accountId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadAccounts() // Recargar cuentas
      } else {
        const data = await response.json()
        alert(data.error || 'Error desconectando cuenta')
      }
    } catch (error) {
      console.error('Error desconectando cuenta:', error)
      alert('Error desconectando cuenta')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '' || dateString === 'null') {
      return 'No expira'
    }
    
    const date = new Date(dateString)
    
    // Si la fecha es inválida o es la época Unix (1 enero 1970)
    if (isNaN(date.getTime()) || date.getTime() < 1000000000000) {
      return 'No expira'
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpiring = (expiresAt: string) => {
    if (!expiresAt || expiresAt === '' || expiresAt === 'null') {
      return false // No expira, no mostrar alerta
    }
    
    const expirationDate = new Date(expiresAt)
    
    // Si la fecha es inválida o es muy antigua (época Unix)
    if (isNaN(expirationDate.getTime()) || expirationDate.getTime() < 1000000000000) {
      return false // No mostrar alerta para tokens que no expiran
    }
    
    const now = new Date()
    const hoursUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilExpiration < 24 && hoursUntilExpiration > 0
  }

  const getTokenInfo = (account: SocialAccount) => {
    // Para Facebook, mostrar información específica sobre el tipo de token
    if (account.provider === 'facebook') {
      const tokenType = (account as any).tokenType || 'unknown'
      const expiresInDays = (account as any).expires_in_days
      const isLongLived = tokenType === 'long-lived'
      
      if (!account.expires_at || account.expires_at === 'null' || new Date(account.expires_at).getTime() < 1000000000000) {
        return {
          text: 'Token permanente',
          color: 'text-green-600',
          description: 'Token de página que no expira'
        }
      }
      
      if (isLongLived && expiresInDays) {
        return {
          text: `Token de larga duración (${expiresInDays} días)`,
          color: 'text-blue-600',
          description: 'Token de usuario de 60 días'
        }
      }
      
      return {
        text: tokenType === 'short-lived' ? 'Token de corta duración' : 'Token estándar',
        color: tokenType === 'short-lived' ? 'text-yellow-600' : 'text-gray-600',
        description: ''
      }
    }
    
    return {
      text: formatDate(account.expires_at),
      color: 'text-gray-600',
      description: ''
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const connectedProviders = new Set(accounts.map(acc => acc.provider))
  const availableProviders = ['facebook', 'instagram', 'google', 'pinterest'] as const

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Cuentas Conectadas</h3>
        <p className="text-sm text-gray-600 mt-1">
          Gestiona las conexiones a tus redes sociales para programar publicaciones
        </p>
      </div>

      <div className="p-6">
        {/* Cuentas conectadas */}
        {accounts.length > 0 && (
          <div className="space-y-4 mb-6">
            {accounts.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {PROVIDER_ICONS[account.provider]}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {account.provider_account_name || PROVIDER_LABELS[account.provider]}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{PROVIDER_LABELS[account.provider]}</span>
                        {account.account_type && (
                          <span>• {account.account_type}</span>
                        )}
                        {account.last_used_at && (
                          <span>• Usado {formatDate(account.last_used_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Estado */}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md border ${
                        STATUS_COLORS[account.status]
                      }`}
                    >
                      {STATUS_LABELS[account.status]}
                    </span>

                    {/* Botones de acción */}
                    {account.status === 'active' ? (
                      <>
                        <button
                          onClick={() => disconnectAccount(account.id, account.provider_account_name || account.provider)}
                          className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                        >
                          Desconectar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => connectAccount(account.provider)}
                        disabled={connecting === account.provider}
                        className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50"
                      >
                        {connecting === account.provider ? 'Conectando...' : 'Reconectar'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Información adicional para cuentas con problemas */}
                {(account.status === 'expired' || account.status === 'error') && account.error_message && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Problema:</strong> {account.error_message}
                    </p>
                  </div>
                )}

                {/* Información de expiración y tipo de token */}
                {account.status === 'active' && (
                  <div className="mt-3 text-xs">
                    {(() => {
                      const tokenInfo = getTokenInfo(account)
                      return (
                        <div>
                          <span className={tokenInfo.color}>
                            Expira: {tokenInfo.text}
                          </span>
                          {tokenInfo.description && (
                            <span className="ml-2 text-gray-500">
                              ({tokenInfo.description})
                            </span>
                          )}
                          {isExpiring(account.expires_at) && (
                            <span className="ml-2 text-yellow-600 font-medium">
                              (¡Expira pronto!)
                            </span>
                          )}
                        </div>
                      )
                    })()}
                    
                    {/* Mostrar botón de renovar solo si realmente expira pronto */}
                    {isExpiring(account.expires_at) && !getTokenInfo(account).text.includes('permanente') && (
                      <div className="mt-2">
                        <button
                          onClick={() => refreshToken(account.id)}
                          disabled={refreshing === account.id}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                        >
                          {refreshing === account.id ? 'Renovando...' : 'Renovar Token'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Permisos */}
                {account.scopes && account.scopes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Permisos:</p>
                    <div className="flex flex-wrap gap-1">
                      {account.scopes.map((scope, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botones para conectar nuevas cuentas */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Conectar nuevas cuentas</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableProviders.map((provider) => (
              <button
                key={provider}
                onClick={() => connectAccount(provider)}
                disabled={connecting === provider}
                className={`flex flex-col items-center p-4 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors ${
                  connectedProviders.has(provider)
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600'
                } ${connecting === provider ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-2">
                  {PROVIDER_ICONS[provider]}
                </div>
                <span className="text-sm font-medium">
                  {connecting === provider ? 'Conectando...' : 
                   connectedProviders.has(provider) ? 'Conectado' : 
                   `Conectar ${PROVIDER_LABELS[provider]}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔗</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No hay cuentas conectadas
            </h4>
            <p className="text-gray-600 mb-4">
              Conecta tus redes sociales para comenzar a programar publicaciones
            </p>
          </div>
        )}
      </div>
    </div>
  )
}