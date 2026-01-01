'use client'

import { useState, useEffect } from 'react'

interface TokenInfo {
  isValid: boolean
  expiresAt?: number
  scopes?: string[]
  appId?: string
  userId?: string
}

interface FacebookConfigProps {
  onClose: () => void
  onSave: (config: any) => void
}

export default function FacebookConfig({ onClose, onSave }: FacebookConfigProps) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkTokenStatus()
  }, [])

  const checkTokenStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar el endpoint que verifica el token configurado
      const response = await fetch('/api/facebook-token-info?useConfig=true')
      const data = await response.json()

      if (data.tokenType && data.isValid) {
        setTokenInfo({
          isValid: data.isValid,
          expiresAt: data.expiresAt,
          scopes: data.scopes,
          appId: data.appId,
          userId: data.userId
        })
      } else {
        setError(data.error || 'Token no válido')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error checking token:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      setRefreshing(true)
      setError(null)

      const response = await fetch('/api/oauth/facebook/refresh', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setTokenInfo(data.tokenInfo)
        alert('Token renovado exitosamente!')
      } else {
        setError(data.error || 'Error renovando token')
      }
    } catch (err) {
      setError('Error de conexión al renovar token')
      console.error('Error refreshing token:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const formatExpirationDate = (timestamp?: number) => {
    if (!timestamp || timestamp === 0) return 'Nunca (token de larga duración)'
    return new Date(timestamp * 1000).toLocaleString('es-ES')
  }

  const getExpirationStatus = (timestamp?: number) => {
    if (!timestamp || timestamp === 0) return 'long-term'
    
    const now = Date.now()
    const expirationTime = timestamp * 1000
    const hoursUntilExpiration = (expirationTime - now) / (1000 * 60 * 60)
    
    if (hoursUntilExpiration < 0) return 'expired'
    if (hoursUntilExpiration < 24) return 'expiring-soon'
    return 'valid'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'long-term':
      case 'valid':
        return 'text-green-600 bg-green-100'
      case 'expiring-soon':
        return 'text-yellow-600 bg-yellow-100'
      case 'expired':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'long-term':
        return 'Token de larga duración'
      case 'valid':
        return 'Token válido'
      case 'expiring-soon':
        return 'Expira pronto'
      case 'expired':
        return 'Expirado'
      default:
        return 'Desconocido'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Configuración de Facebook</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Verificando token...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {tokenInfo && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Estado del Token</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(getExpirationStatus(tokenInfo.expiresAt))
                        }`}
                      >
                        {tokenInfo.isValid ? getStatusText(getExpirationStatus(tokenInfo.expiresAt)) : 'Inválido'}
                      </span>
                    </div>

                    {tokenInfo.expiresAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expira:</span>
                        <span className="text-sm text-gray-900">
                          {formatExpirationDate(tokenInfo.expiresAt)}
                        </span>
                      </div>
                    )}

                    {tokenInfo.scopes && (
                      <div>
                        <span className="text-sm text-gray-600">Permisos:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tokenInfo.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={refreshToken}
                    disabled={refreshing}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {refreshing ? 'Renovando...' : 'Renovar Token'}
                  </button>

                  <button
                    onClick={checkTokenStatus}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Verificar Estado
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Configuración OAuth2 Automática</h4>
              <p className="text-sm text-blue-700 mb-3">
                El sistema verifica automáticamente el estado del token antes de cada publicación
                y lo renueva si es necesario. Los tokens de larga duración duran hasta 60 días.
              </p>
              {tokenInfo && !tokenInfo.isValid && (
                <div className="mt-3">
                  <a 
                    href="/facebook-setup" 
                    target="_blank"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    📖 Ver guía completa para configurar permisos de Facebook →
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => onSave(tokenInfo)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Guardar
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}