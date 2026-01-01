'use client';

import { useState } from 'react';

export default function FacebookTokenManagerPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCurrentToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/facebook-token-info?useConfig=true');
      const data = await response.json();
      
      if (response.ok) {
        setTokenInfo(data);
      } else {
        setError(data.error || 'Error checking token');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getPageToken = async (pageIndex = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/facebook-token-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usePageIndex: pageIndex })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTokenInfo((prev: any) => ({ ...prev, pageTokenResult: data }));
      } else {
        setError(data.error || 'Error obteniendo Page Token');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🔧 Gestor de Tokens de Facebook
            </h1>
            <p className="text-gray-600">
              Diagnostica y verifica el token "FB TOKEN" configurado en n8n
            </p>
          </div>

          <div className="space-y-8">
            {/* Check Current Token */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                📊 Verificar Token Actual
              </h2>
              <button
                onClick={checkCurrentToken}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar Token Configurado'}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium">❌ Error: {error}</p>
              </div>
            )}

            {/* Token Info Display */}
            {tokenInfo && (
              <div className="space-y-6">
                {/* Current Token Status */}
                <div className={`border rounded-lg p-6 ${
                  tokenInfo.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    tokenInfo.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    🔑 Estado del Token Actual
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Tipo:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        tokenInfo.tokenType === 'PAGE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tokenInfo.tokenType}
                      </span>
                    </div>
                    <div>
                      <strong>Válido:</strong> {tokenInfo.isValid ? '✅ Sí' : '❌ No'}
                    </div>
                    <div>
                      <strong>Expira:</strong> 
                      {tokenInfo.hasExpiration 
                        ? new Date(tokenInfo.expiresAt * 1000).toLocaleString() 
                        : '🏆 Nunca (Permanente)'
                      }
                    </div>
                    <div>
                      <strong>App ID:</strong> {tokenInfo.appId}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-4">
                    {tokenInfo.recommendation === 'TOKEN_OPTIMAL' && (
                      <div className="bg-green-100 p-3 rounded">
                        <p className="text-green-800 font-medium">
                          ✅ ¡Perfecto! Estás usando un Page Access Token óptimo.
                        </p>
                      </div>
                    )}
                    
                    {tokenInfo.recommendation === 'USE_PAGE_TOKEN' && (
                      <div className="bg-yellow-100 p-3 rounded">
                        <p className="text-yellow-800 font-medium">
                          ⚠️ Estás usando un User Token. Recomendamos cambiar a Page Token para evitar expiraciones.
                        </p>
                      </div>
                    )}

                    {tokenInfo.recommendation === 'NO_PAGES_AVAILABLE' && (
                      <div className="bg-red-100 p-3 rounded">
                        <p className="text-red-800 font-medium">
                          ❌ No tienes páginas de Facebook disponibles.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Pages */}
                {tokenInfo.pageTokens && tokenInfo.pageTokens.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4">
                      📄 Páginas Disponibles
                    </h3>
                    <div className="space-y-3">
                      {tokenInfo.pageTokens.map((page: any, index: number) => (
                        <div key={page.id} className="bg-white p-4 rounded border">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{page.name}</h4>
                              <p className="text-sm text-gray-600">ID: {page.id}</p>
                            </div>
                            <button
                              onClick={() => getPageToken(index)}
                              disabled={loading}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                            >
                              Obtener Token
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Page Token Result */}
                {tokenInfo.pageTokenResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">
                      🎉 Page Access Token Obtenido
                    </h3>
                    
                    <div className="mb-4">
                      <p><strong>Página:</strong> {tokenInfo.pageTokenResult.page.name}</p>
                      <p><strong>ID:</strong> {tokenInfo.pageTokenResult.page.id}</p>
                      <p><strong>Permanente:</strong> {tokenInfo.pageTokenResult.isPermanent ? '✅ Sí' : '❌ No'}</p>
                    </div>

                    <div className="bg-gray-100 p-4 rounded">
                      <p className="font-medium mb-2">🔑 Token a usar (cópialo):</p>
                      <code className="break-all text-sm bg-white p-2 rounded block">
                        {tokenInfo.pageTokenResult.page.access_token}
                      </code>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">📋 Instrucciones:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {tokenInfo.pageTokenResult.instructions.map((instruction: string, index: number) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Fix Guide */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🚀 Solución Rápida
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Si el token caduca rápidamente:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Ejecuta <code className="bg-gray-200 px-1 rounded">node refresh-facebook-token.js</code></li>
                  <li>Sigue las instrucciones para obtener un Page Token</li>
                  <li>Actualiza tu <code className="bg-gray-200 px-1 rounded">.env</code> con el nuevo token</li>
                  <li>Reinicia la aplicación</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}