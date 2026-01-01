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
  facebook: '📘',
  instagram: '📷',
  google: '🔍',
  pinterest: '📌'
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
    
    if (oauthSuccess && account) {
      alert(`Éxito: Cuenta ${oauthSuccess} conectada: ${decodeURIComponent(account)}`)
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

      if (response.ok) {
        setAccounts(data.accounts || [])
      } else {
        console.error('Error cargando cuentas:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpiring = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    const hoursUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilExpiration < 24
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
                        {isExpiring(account.expires_at) && (
                          <button
                            onClick={() => refreshToken(account.id)}
                            disabled={refreshing === account.id}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                          >
                            {refreshing === account.id ? 'Renovando...' : 'Renovar'}
                          </button>
                        )}
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

                {/* Información de expiración */}
                {account.status === 'active' && (
                  <div className="mt-3 text-xs text-gray-500">
                    <span>Expira: {formatDate(account.expires_at)}</span>
                    {isExpiring(account.expires_at) && (
                      <span className="ml-2 text-yellow-600 font-medium">
                        (¡Expira pronto!)
                      </span>
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