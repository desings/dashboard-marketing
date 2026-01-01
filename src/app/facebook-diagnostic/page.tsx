'use client';

import { useState } from 'react';

export default function FacebookDiagnosticPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    setTestResults(null);

    const results: any = {
      n8nWebhook: null,
      tokenInfo: null,
      directApi: null,
      hybridApi: null
    };

    try {
      // Test 1: n8n webhook
      console.log('🔍 Testing n8n webhook...');
      try {
        const n8nResponse = await fetch('/api/n8n-test');
        results.n8nWebhook = await n8nResponse.json();
      } catch (error) {
        results.n8nWebhook = { success: false, error: 'Connection failed' };
      }

      // Test 2: Token info
      console.log('🔍 Testing token info...');
      try {
        const tokenResponse = await fetch('/api/facebook-token-info?useConfig=true');
        results.tokenInfo = await tokenResponse.json();
      } catch (error) {
        results.tokenInfo = { error: 'Token check failed' };
      }

      // Test 3: Direct API
      console.log('🔍 Testing direct API...');
      try {
        const directResponse = await fetch('/api/publish-real', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Diagnostic test (not published)',
            platform: 'facebook',
            publishNow: false
          })
        });
        results.directApi = await directResponse.json();
      } catch (error) {
        results.directApi = { success: false, error: 'Direct API failed' };
      }

      // Test 4: Hybrid API
      console.log('🔍 Testing hybrid API...');
      try {
        const hybridResponse = await fetch('/api/publish-via-n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Diagnostic test (not published)',
            platform: 'facebook',
            publishNow: false
          })
        });
        results.hybridApi = await hybridResponse.json();
      } catch (error) {
        results.hybridApi = { success: false, error: 'Hybrid API failed' };
      }

    } catch (error) {
      console.error('Diagnostic error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusColor = (success: boolean | null) => {
    if (success === null) return 'bg-gray-100 text-gray-800';
    return success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (success: boolean | null) => {
    if (success === null) return '⏳';
    return success ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🔧 Diagnóstico de Facebook Publishing
            </h1>
            <p className="text-gray-600">
              Verifica el estado de todas las integraciones de Facebook
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              📋 Antes de empezar
            </h2>
            <div className="space-y-2 text-blue-700">
              <p><strong>Para solucionar el problema:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ve a n8n: <a href="https://vmi2907616.contaboserver.net" target="_blank" className="underline">https://vmi2907616.contaboserver.net</a></li>
                <li>Busca el workflow "Facebook Real Publishing" o importa el nuevo</li>
                <li>Activa el workflow (toggle ON en la esquina superior derecha)</li>
                <li>Verifica que la credencial "FB TOKEN" esté conectada</li>
                <li>Ejecuta este diagnóstico para verificar</li>
              </ol>
            </div>
          </div>

          {/* Diagnostic Button */}
          <div className="text-center mb-8">
            <button
              onClick={runDiagnostic}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ejecutando diagnóstico...' : '🔍 Ejecutar Diagnóstico Completo'}
            </button>
          </div>

          {/* Results */}
          {testResults && (
            <div className="space-y-6">
              {/* n8n Webhook */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">1. n8n Webhook (OAuth2)</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(testResults.n8nWebhook?.success)}`}>
                    {getStatusIcon(testResults.n8nWebhook?.success)} {testResults.n8nWebhook?.success ? 'Funcionando' : 'No disponible'}
                  </span>
                </div>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <pre>{JSON.stringify(testResults.n8nWebhook, null, 2)}</pre>
                </div>
                {!testResults.n8nWebhook?.success && (
                  <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                    <strong>Solución:</strong> Activa el workflow en n8n
                  </div>
                )}
              </div>

              {/* Token Info */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">2. Token de Facebook</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(testResults.tokenInfo?.isValid)}`}>
                    {getStatusIcon(testResults.tokenInfo?.isValid)} {testResults.tokenInfo?.isValid ? 'Válido' : 'Inválido/Expirado'}
                  </span>
                </div>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <pre>{JSON.stringify(testResults.tokenInfo, null, 2)}</pre>
                </div>
                {!testResults.tokenInfo?.isValid && (
                  <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-sm">
                    <strong>Problema:</strong> El token en .env está expirado. Usar OAuth2 en n8n es la solución.
                  </div>
                )}
              </div>

              {/* Direct API */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">3. API Directa (Fallback)</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(testResults.directApi?.success)}`}>
                    {getStatusIcon(testResults.directApi?.success)} {testResults.directApi?.success ? 'Funcionando' : 'No funciona'}
                  </span>
                </div>
                <div className="bg-gray-100 p-3 rounded text-sm max-h-40 overflow-y-auto">
                  <pre>{JSON.stringify(testResults.directApi, null, 2)}</pre>
                </div>
              </div>

              {/* Hybrid API */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">4. Sistema Híbrido</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(testResults.hybridApi?.success)}`}>
                    {getStatusIcon(testResults.hybridApi?.success)} {testResults.hybridApi?.success ? 'Funcionando' : 'No funciona'}
                  </span>
                </div>
                <div className="bg-gray-100 p-3 rounded text-sm max-h-40 overflow-y-auto">
                  <pre>{JSON.stringify(testResults.hybridApi, null, 2)}</pre>
                </div>
              </div>

              {/* Solution Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  🎯 Resumen y Solución
                </h3>
                <div className="space-y-2 text-green-700">
                  {testResults.n8nWebhook?.success ? (
                    <p>✅ <strong>n8n está funcionando!</strong> OAuth2 activo, no necesitas tokens manuales.</p>
                  ) : (
                    <p>❌ <strong>n8n no está activo.</strong> Activa el workflow para usar OAuth2 automático.</p>
                  )}
                  
                  {!testResults.tokenInfo?.isValid && (
                    <p>⚠️ <strong>Token expirado.</strong> Esto es normal, OAuth2 en n8n lo solucionará.</p>
                  )}
                  
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p><strong>Pasos siguientes:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>Activa el workflow en n8n</li>
                      <li>Verifica que "FB TOKEN" esté conectado</li>
                      <li>Ejecuta este diagnóstico nuevamente</li>
                      <li>¡Las publicaciones funcionarán automáticamente!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}