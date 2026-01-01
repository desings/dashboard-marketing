"use client";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import ConnectedAccounts from '../../../components/ConnectedAccounts';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    notifications: true,
    autoPost: false,
    timezone: 'America/Mexico_City',
    language: 'es'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Aquí podrías guardar en la API
    console.log(`Setting ${key} changed to:`, value);
  };

  return (
    <DashboardLayout 
      title="Configuración" 
      subtitle="Personaliza tu experiencia en la plataforma"
    >
      <div className="space-y-6">
        
        {/* User Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Perfil de Usuario</h3>
            <p className="text-sm text-gray-600 mt-1">Información básica de tu cuenta</p>
          </div>
          
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h4>
                <p className="text-gray-600">{user?.email}</p>
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mt-1">
                  Activo
                </span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input 
                  type="text" 
                  value={user?.firstName || ''} 
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                <input 
                  type="text" 
                  value={user?.lastName || ''} 
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            <p className="text-sm text-gray-600 mt-1">Controla cómo y cuándo recibes notificaciones</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Notificaciones Push</h4>
                <p className="text-sm text-gray-600">Recibe alertas cuando se publique contenido</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Publicación Automática</h4>
                <p className="text-sm text-gray-600">Permite que el sistema publique sin confirmación</p>
              </div>
              <button
                onClick={() => handleSettingChange('autoPost', !settings.autoPost)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoPost ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoPost ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Configuración General</h3>
            <p className="text-sm text-gray-600 mt-1">Preferencias de idioma y zona horaria</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                <select 
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/New_York">Nueva York (GMT-5)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                <select 
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Cuentas Conectadas - Nueva sección */}
        <ConnectedAccounts userId={user?.id || 'demo-user'} />
        
      </div>
    </DashboardLayout>
  );
}