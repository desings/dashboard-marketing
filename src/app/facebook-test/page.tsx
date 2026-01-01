'use client'

import React, { useState, useEffect } from 'react'

export default function FacebookQuickTest() {
  const [content, setContent] = useState('🧪 Prueba de publicación desde Dashboard - ' + new Date().toLocaleString())
  const [pageData, setPageData] = useState<any>(null)
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    // Cargar datos de Facebook desde localStorage
    try {
      const accounts = JSON.parse(localStorage.getItem('connected_accounts') || '[]')
      const fbAccount = accounts.find((acc: any) => acc.provider === 'facebook')
      if (fbAccount) {
        setPageData(fbAccount)
      }
    } catch (error) {
      console.error('Error loading Facebook data:', error)
    }
  }, [])

  const handlePublish = async () => {
    if (!pageData?.pageToken) {
      alert('No hay token de Facebook disponible. Conecta tu cuenta primero.')
      return
    }

    setPublishing(true)
    setResult(null)

    try {
      const response = await fetch('/api/facebook-publish-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          pageToken: pageData.pageToken,
          pageId: pageData.pageId
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        alert('✅ ¡Publicación exitosa! Post ID: ' + data.postId)
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error de conexión')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">🧪 Prueba Rápida de Facebook</h2>
      
      {/* Estado de conexión */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-2">Estado de Conexión:</h3>
        {pageData ? (
          <div className="text-green-600">
            ✅ Conectado: {pageData.provider_account_name}
            <br />
            <small className="text-gray-600">
              Tipo: {pageData.account_type} | 
              Page ID: {pageData.pageId || 'N/A'}
            </small>
          </div>
        ) : (
          <div className="text-red-600">
            ❌ No conectado - Ve a Settings para conectar Facebook
          </div>
        )}
      </div>

      {/* Editor de contenido */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Contenido del post:
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-lg"
          placeholder="Escribe tu mensaje aquí..."
        />
      </div>

      {/* Botón de publicar */}
      <button
        onClick={handlePublish}
        disabled={publishing || !pageData?.pageToken}
        className={`w-full py-3 px-4 rounded-lg font-semibold ${
          publishing || !pageData?.pageToken
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {publishing ? 'Publicando...' : '🚀 Publicar en Facebook'}
      </button>

      {/* Resultado */}
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <h4 className="font-semibold mb-2">Resultado:</h4>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}