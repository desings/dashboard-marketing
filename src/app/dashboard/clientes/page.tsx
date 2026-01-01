"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";

type Tenant = {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt: string;
};

type SocialAccount = {
  id: string;
  platform: string;
  username: string;
  isActive: boolean;
  isConnected: boolean;
  connectionError?: string | null;
  lastSyncAt?: string;
  expiresAt?: string;
  createdAt: string;
  settings?: Record<string, any>;
};

type ClientWithSocials = {
  id: string;
  tenant: Tenant;
  socialAccounts: SocialAccount[];
};

const PLATFORMS = [
  { 
    key: "facebook", 
    name: "Facebook", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg", 
    color: "#1877F2",
    placeholder: "@mi_empresa" 
  },
  { 
    key: "instagram", 
    name: "Instagram", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg", 
    color: "#E4405F",
    placeholder: "@mi_empresa" 
  },
  { 
    key: "pinterest", 
    name: "Pinterest", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg", 
    color: "#BD081C",
    placeholder: "@mi_empresa" 
  },
  { 
    key: "twitter", 
    name: "Twitter/X", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg", 
    color: "#000000",
    placeholder: "@mi_empresa" 
  },
  { 
    key: "linkedin", 
    name: "LinkedIn", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg", 
    color: "#0A66C2",
    placeholder: "empresa-nombre" 
  },
  { 
    key: "youtube", 
    name: "YouTube", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg", 
    color: "#FF0000",
    placeholder: "@MiEmpresa" 
  },
  { 
    key: "tiktok", 
    name: "TikTok", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg", 
    color: "#000000",
    placeholder: "@mi_empresa" 
  },
  { 
    key: "telegram", 
    name: "Telegram", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg", 
    color: "#26A5E4",
    placeholder: "@mi_canal" 
  },
  { 
    key: "whatsapp", 
    name: "WhatsApp Business", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg", 
    color: "#25D366",
    placeholder: "+1234567890" 
  },
  { 
    key: "snapchat", 
    name: "Snapchat", 
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg", 
    color: "#FFFC00",
    placeholder: "@mi_empresa" 
  }
];

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithSocials[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientWithSocials | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSocialAccount, setEditingSocialAccount] = useState<SocialAccount | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    logo: null as File | null
  });
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [socialForms, setSocialForms] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchClients();
    checkUrlParams(); // Verificar parámetros de OAuth callback
  }, []);

  // Verificar parámetros de URL para callbacks de OAuth
  const checkUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const platform = params.get('platform');
    const mode = params.get('mode');

    if (success === 'connected' && platform) {
      const message = mode === 'mock' 
        ? `Cuenta de ${platform} conectada exitosamente (MODO DESARROLLO)`
        : `Cuenta de ${platform} conectada exitosamente`;
      showNotification('success', message);
      // Limpiar parámetros y refrescar datos
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(fetchClients, 1000);
    } else if (error && platform) {
      let errorMessage = `Error conectando ${platform}`;
      
      switch (error) {
        case 'cancelled':
          errorMessage = `Conexión a ${platform} cancelada`;
          break;
        case 'invalid_request':
          errorMessage = `Solicitud inválida para ${platform}`;
          break;
        case 'connection_failed':
          errorMessage = `Error de conexión con ${platform}`;
          break;
      }
      
      showNotification('error', errorMessage);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Verificar si una plataforma soporta OAuth
  const supportsOAuth = (platform: string) => {
    return ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].includes(platform);
  };

  // Iniciar flujo OAuth via n8n
  const handleOAuthConnect = async (platform: string) => {
    if (!selectedClient) {
      showNotification('error', 'Selecciona un cliente primero');
      return;
    }

    try {
      showNotification('info', `Iniciando conexión con ${platform}...`);

      const response = await fetch('/api/n8n-trigger/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedClient.tenant.id,
          clientId: selectedClient.id,
          action: 'connect',
          platform: platform,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al iniciar conexión');
      }

      if (result.data?.authUrl) {
        // n8n devolvió una URL de autorización, redirigir
        window.location.href = result.data.authUrl;
      } else {
        // Conexión procesada directamente
        showNotification('success', result.message || `Conexión con ${platform} exitosa`);
        fetchClients(); // Refrescar datos
      }

    } catch (error) {
      console.error('Error conectando cuenta:', error);
      showNotification('error', `Error al conectar ${platform}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Desconectar cuenta social via n8n
  const handleDisconnectAccount = async (platform: string) => {
    if (!selectedClient) return;

    if (!confirm(`¿Estás seguro de que quieres desconectar la cuenta de ${platform}?`)) {
      return;
    }

    try {
      showNotification('info', `Desconectando ${platform}...`);

      const response = await fetch('/api/n8n-trigger/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedClient.tenant.id,
          clientId: selectedClient.id,
          action: 'disconnect',
          platform: platform,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al desconectar cuenta');
      }

      showNotification('success', `Cuenta de ${platform} desconectada exitosamente`);
      fetchClients(); // Refrescar datos

    } catch (error) {
      console.error('Error desconectando cuenta:', error);
      showNotification('error', `Error al desconectar ${platform}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      setFormData({
        name: selectedClient.tenant.name,
        email: "",
        phone: "",
        logo: null
      });
      setLogoPreview(selectedClient.tenant.logoUrl || null);
      
      // Initialize social forms
      const socialData: {[key: string]: string} = {};
      selectedClient.socialAccounts.forEach(account => {
        socialData[account.platform] = account.username;
      });
      setSocialForms(socialData);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      console.log("Fetching clients...");
      const response = await fetch("/api/clientes");
      if (response.ok) {
        const data = await response.json();
        console.log("Clients fetched:", data.clients);
        setClients(data.clients || []);
        
        // Si hay un cliente seleccionado, actualizarlo con los nuevos datos
        if (selectedClient) {
          const updatedClient = data.clients.find((c: ClientWithSocials) => 
            c.tenant.id === selectedClient.tenant.id
          );
          if (updatedClient) {
            setSelectedClient(updatedClient);
          }
        }
      } else {
        console.error("Error fetching clients, status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener estado detallado de las cuentas sociales
  const fetchDetailedSocialAccounts = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/social-accounts?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        return data.socialAccounts || [];
      }
    } catch (error) {
      console.error("Error fetching detailed social accounts:", error);
    }
    return [];
  };

  const handleCreateClient = () => {
    setIsCreating(true);
    setSelectedClient(null);
    setFormData({ name: "", email: "", phone: "", logo: null });
    setLogoPreview(null);
    setSocialForms({});
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClient = async () => {
    if (!formData.name.trim()) {
      alert("El nombre del cliente es requerido");
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        // Crear nuevo cliente
        const response = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email,
            phone: formData.phone
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Cliente creado, respuesta:", result);
          await fetchClients();
          setIsCreating(false);
          setSelectedClient(null);
          alert("¡Cliente creado exitosamente!");
        } else {
          const error = await response.json();
          console.error("Error creando cliente:", error);
          alert(`Error: ${error.error || "No se pudo crear el cliente"}`);
        }
      } else if (selectedClient) {
        // Actualizar cliente existente
        const response = await fetch("/api/clientes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: selectedClient.tenant.id,
            name: formData.name.trim(),
            email: formData.email,
            phone: formData.phone,
            logoUrl: selectedClient.tenant.logoUrl
          }),
        });

        if (response.ok) {
          await fetchClients();
          // Actualizar el cliente seleccionado
          const updatedClients = await fetch("/api/clientes").then(r => r.json());
          const updatedClient = updatedClients.clients?.find((c: any) => c.tenant.id === selectedClient.tenant.id);
          if (updatedClient) {
            setSelectedClient(updatedClient);
          }
          alert("¡Cliente actualizado exitosamente!");
        } else {
          const error = await response.json();
          alert(`Error: ${error.error || "No se pudo actualizar el cliente"}`);
        }
      }
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSocialAccount = async (platform: string) => {
    const username = socialForms[platform];
    if (!username || !selectedClient) return;

    try {
      const response = await fetch("/api/social-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedClient.tenant.id,
          platform,
          username,
          isActive: true,
        }),
      });

      if (response.ok) {
        await fetchClients();
        // Update selected client data
        const updatedClient = clients.find(c => c.tenant.id === selectedClient.tenant.id);
        if (updatedClient) {
          setSelectedClient(updatedClient);
        }
      }
    } catch (error) {
      console.error("Error saving social account:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Gestión de Clientes" subtitle="Cargando datos...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Gestión de Clientes" 
      subtitle={selectedClient ? `Editando: ${selectedClient.tenant.name}` : "Administra tus clientes y configuraciones"}
    >
      <div className="space-y-6">
        
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <i className={`fas ${
              notification.type === 'success' ? 'fa-check-circle text-green-600' :
              notification.type === 'error' ? 'fa-exclamation-circle text-red-600' :
              'fa-info-circle text-blue-600'
            }`}></i>
            <span className={`${
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {notification.message}
            </span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        
        {/* Client Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cliente Actual</h3>
                <p className="text-sm text-gray-600">{selectedClient ? selectedClient.tenant.name : 'Selecciona un cliente para gestionar'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedClient?.tenant.id || ''}
                onChange={(e) => {
                  const client = clients.find(c => c.tenant.id === e.target.value);
                  setSelectedClient(client || null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-64"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((client) => (
                  <option key={client.tenant.id} value={client.tenant.id}>
                    {client.tenant.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleCreateClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Nuevo Cliente
              </button>
            </div>
          </div>
        </div>

        {/* Client Form */}
        {(isCreating || selectedClient) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isCreating ? 'Crear Nuevo Cliente' : 'Editar Cliente'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedClient(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Ej: Restaurante Los Sabores"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="contacto@cliente.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="+1234567890"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo del Cliente
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {logoPreview && (
                    <div className="mt-3">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedClient(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveClient}
                  disabled={!formData.name.trim() || isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      {isCreating ? 'Crear Cliente' : 'Guardar Cambios'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Accounts */}
        {selectedClient && !isCreating && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cuentas de Redes Sociales</h3>
              <p className="text-sm text-gray-600 mt-1">Configura las cuentas de redes sociales del cliente</p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLATFORMS.map((platform) => {
                  const existingAccount = selectedClient.socialAccounts.find(
                    account => account.platform === platform.key
                  );
                  
                  const isOAuthSupported = supportsOAuth(platform.key);
                  const isConnected = existingAccount?.isConnected || false;
                  const hasAccount = !!existingAccount;
                  
                  return (
                    <div key={platform.key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: platform.color + '20' }}
                        >
                          <img 
                            src={platform.logo} 
                            alt={platform.name}
                            className="w-6 h-6"
                            style={{ filter: 'brightness(0) saturate(100%)' }}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                          <div className="flex items-center space-x-2">
                            {isOAuthSupported && (
                              <>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  isConnected 
                                    ? 'bg-green-100 text-green-800' 
                                    : hasAccount 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {isConnected ? 'Conectada' : hasAccount ? 'Configurada' : 'Sin conectar'}
                                </span>
                                {isConnected && (
                                  <i className="fas fa-check-circle text-green-500 text-sm"></i>
                                )}
                              </>
                            )}
                            {!isOAuthSupported && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Manual
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Información de la cuenta */}
                      {existingAccount && (
                        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            <div className="font-medium flex items-center space-x-2">
                              <span>@{existingAccount.username}</span>
                              {existingAccount.settings?.isMock && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <i className="fas fa-flask mr-1"></i>
                                  DEMO
                                </span>
                              )}
                            </div>
                            {existingAccount.connectionError && (
                              <div className="text-red-600 text-xs mt-1">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                {existingAccount.connectionError}
                              </div>
                            )}
                            {existingAccount.expiresAt && (
                              <div className="text-gray-500 text-xs mt-1">
                                Expira: {new Date(existingAccount.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {/* OAuth Platforms */}
                        {isOAuthSupported ? (
                          <>
                            {!isConnected ? (
                              <button
                                onClick={() => handleOAuthConnect(platform.key)}
                                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                              >
                                <i className="fas fa-link"></i>
                                <span>Conectar con {platform.name}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDisconnectAccount(platform.key)}
                                className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                              >
                                <i className="fas fa-unlink"></i>
                                <span>Desconectar</span>
                              </button>
                            )}
                          </>
                        ) : (
                          // Manual Platforms
                          <>
                            <input
                              type="text"
                              value={socialForms[platform.key] || existingAccount?.username || ''}
                              onChange={(e) => setSocialForms({
                                ...socialForms,
                                [platform.key]: e.target.value
                              })}
                              placeholder={platform.placeholder}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            
                            <button
                              onClick={() => handleSaveSocialAccount(platform.key)}
                              disabled={!socialForms[platform.key]}
                              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {existingAccount ? 'Actualizar' : 'Guardar'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Clients List */}
        {!isCreating && !selectedClient && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
                <span className="text-sm text-gray-500">{clients.length} clientes</span>
              </div>
            </div>
            
            <div className="p-6">
              {clients.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-users text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes</h3>
                  <p className="text-gray-600 mb-4">Comienza creando tu primer cliente</p>
                  <button
                    onClick={handleCreateClient}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Crear Primer Cliente
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <div 
                      key={client.tenant.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        {client.tenant.logoUrl ? (
                          <img 
                            src={client.tenant.logoUrl} 
                            alt={client.tenant.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {client.tenant.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{client.tenant.name}</h4>
                          <p className="text-sm text-gray-600">
                            {client.socialAccounts.length} cuentas sociales
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Creado {new Date(client.tenant.createdAt).toLocaleDateString()}</span>
                        <i className="fas fa-chevron-right"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </DashboardLayout>
  );
}