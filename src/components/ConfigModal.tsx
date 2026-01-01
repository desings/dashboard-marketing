"use client";

import React, { useState, useEffect } from 'react';

interface ConfigModalProps {
  platform: string;
  clientId: string;
  onSave: () => void;
}

interface PlatformConfig {
  name: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    help?: string;
  }[];
  instructions: string;
  tokenDuration: string;
}

const platformConfigs: { [key: string]: PlatformConfig } = {
  facebook: {
    name: 'Facebook',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', placeholder: 'Ej: 1234567890123456' },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'Secreto de tu aplicación' },
      { key: 'pageId', label: 'Page ID (opcional)', type: 'text', placeholder: 'ID de tu página de Facebook', help: 'Necesario para publicar en páginas' }
    ],
    instructions: '1. Ve a developers.facebook.com\n2. Crea nueva app → Tipo: Business\n3. Agrega Facebook Login y Pages API\n4. En Configuración básica, copia App ID y App Secret\n5. En herramientas de la app, genera token de acceso\n6. Usa Graph Explorer para obtener page_id si publicas en páginas',
    tokenDuration: 'App credentials (permanentes) + User tokens (renovables)'
  },
  instagram: {
    name: 'Instagram Business',
    fields: [
      { key: 'appId', label: 'Facebook App ID', type: 'text', placeholder: 'Mismo App ID de Facebook' },
      { key: 'appSecret', label: 'Facebook App Secret', type: 'password', placeholder: 'Mismo App Secret de Facebook' },
      { key: 'instagramAccountId', label: 'Instagram Business Account ID', type: 'text', placeholder: 'Ej: 17841400001234567', help: 'ID de tu cuenta de Instagram Business conectada a Facebook' }
    ],
    instructions: '1. Convierte tu Instagram a Business Account\n2. Conecta con una página de Facebook\n3. En developers.facebook.com, misma app que Facebook\n4. Agrega Instagram Basic Display + Instagram API\n5. Usa Graph Explorer: me/accounts para encontrar tu Instagram ID\n6. El account_id será diferente al username',
    tokenDuration: 'Usa las mismas credenciales de Facebook'
  },
  twitter: {
    name: 'X (Twitter)',
    fields: [
      { key: 'bearerToken', label: 'Bearer Token', type: 'password', placeholder: 'App Bearer Token (solo lectura)' },
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Consumer Key' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Consumer Secret' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'User Access Token (para publicar)' },
      { key: 'accessTokenSecret', label: 'Access Token Secret', type: 'password', placeholder: 'User Access Token Secret' }
    ],
    instructions: '1. Ve a developer.x.com (antes Twitter)\n2. Crea proyecto y app (requiere aplicación aprobada)\n3. En Keys and Tokens:\n   - Copia Bearer Token (solo lectura)\n   - Genera Consumer Keys (API Key/Secret)\n   - Genera Access Token con permisos de escritura\n4. Configura OAuth 1.0a en app settings',
    tokenDuration: 'Permanente hasta que se revoquen manualmente'
  },
  linkedin: {
    name: 'LinkedIn',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Tu Client ID de LinkedIn' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Tu Client Secret' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Tu Access Token de LinkedIn' }
    ],
    instructions: '1. Ve a developers.linkedin.com\n2. Crea una nueva app\n3. Solicita acceso a LinkedIn Marketing API\n4. Genera tokens con permisos w_member_social',
    tokenDuration: '60 días (renovable)'
  },
  youtube: {
    name: 'YouTube',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Tu Client ID de Google' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Tu Client Secret de Google' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', placeholder: 'Tu Refresh Token', help: 'El refresh token permite generar nuevos access tokens automáticamente' }
    ],
    instructions: '1. Ve a console.cloud.google.com\n2. Habilita YouTube Data API v3\n3. Crea credenciales OAuth 2.0\n4. Obtén un refresh token para acceso permanente',
    tokenDuration: 'Permanente con refresh token'
  }
};

const ConfigModal: React.FC<ConfigModalProps> = ({ platform, clientId, onSave }) => {
  const [credentials, setCredentials] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const config = platformConfigs[platform];

  useEffect(() => {
    // Cargar credenciales existentes
    loadExistingCredentials();
  }, [platform, clientId]);

  const loadExistingCredentials = async () => {
    try {
      const response = await fetch(`/api/oauth/credentials?platform=${platform}&clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials || {});
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/oauth/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          credentials,
          clientId
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error de conexión. Verifica tus credenciales.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCredentials = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/oauth/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          credentials,
          clientId
        }),
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Credenciales guardadas. Ahora puedes autorizar la aplicación.'
        });
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startOAuthFlow = async () => {
    setIsAuthorizing(true);
    
    try {
      const response = await fetch(`/api/oauth/authorize?platform=${platform}&clientId=${clientId}`);
      const data = await response.json();
      
      if (response.ok && data.authUrl) {
        // Abrir ventana de autorización
        window.open(data.authUrl, 'oauth', 'width=500,height=600,scrollbars=yes');
        setTestResult({
          success: true,
          message: 'Ventana de autorización abierta. Completa el proceso y regresa aquí.'
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Error iniciando autorización OAuth'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error iniciando OAuth. Asegúrate de haber guardado las credenciales primero.'
      });
    } finally {
      setIsAuthorizing(false);
    }
  };

  if (!config) {
    return <div>Plataforma no soportada</div>;
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
        <pre className="text-xs text-blue-700 whitespace-pre-wrap">{config.instructions}</pre>
        <p className="text-xs text-blue-600 mt-2 font-medium">
          ⏱️ Duración del token: {config.tokenDuration}
        </p>
      </div>

      <div className="space-y-4">
        {config.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={credentials[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {field.help && (
              <p className="text-xs text-gray-500 mt-1">{field.help}</p>
            )}
          </div>
        ))}
      </div>

      {testResult && (
        <div className={`mt-4 p-3 rounded-lg ${
          testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <p className="text-sm">{testResult.message}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <button
          onClick={testConnection}
          disabled={isLoading || isAuthorizing}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? 'Probando...' : '🔍 Test Básico'}
        </button>
        
        <button
          onClick={saveCredentials}
          disabled={isLoading || isAuthorizing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : '💾 Guardar'}
        </button>
      </div>

      {/* OAuth Authorization Button */}
      {['facebook', 'instagram', 'linkedin', 'youtube'].includes(platform) && (
        <div className="mt-3">
          <button
            onClick={startOAuthFlow}
            disabled={isLoading || isAuthorizing}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {isAuthorizing ? 'Iniciando autorización...' : '🔐 Autorizar Aplicación (OAuth)'}
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Guarda las credenciales primero, luego haz clic aquí para completar la autorización OAuth
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfigModal;