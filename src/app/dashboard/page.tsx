"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";

type Tenant = {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  logoUrl?: string;
};

type Stats = {
  totalClients: number;
  totalPosts: number;
  scheduledPosts: number;
  connectedAccounts: number;
};

export default function DashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalPosts: 0,
    scheduledPosts: 0,
    connectedAccounts: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTenants();
    fetchStats();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
        
        const saved = localStorage.getItem("selectedTenant");
        if (saved && data.tenants.some((t: Tenant) => t.id === saved)) {
          setSelectedTenant(saved);
        } else if (data.tenants.length > 0) {
          setSelectedTenant(data.tenants[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Mock stats for now - replace with real API calls
    setStats({
      totalClients: 12,
      totalPosts: 145,
      scheduledPosts: 8,
      connectedAccounts: 6
    });
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    localStorage.setItem("selectedTenant", tenantId);
  };

  const selectedTenantData = tenants.find(t => t.id === selectedTenant);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Cargando datos...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Dashboard Principal" 
      subtitle={selectedTenantData ? `Empresa: ${selectedTenantData.name}` : "Selecciona una empresa"}
    >
      {/* Tenant Selector */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-building text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Empresa Actual</h3>
                <p className="text-sm text-gray-600">Selecciona la empresa para gestionar</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTenant}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-48"
              >
                <option value="">Seleccionar empresa...</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              
              {selectedTenantData && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <i className="fas fa-check-circle text-sm"></i>
                  <span className="text-sm font-medium">Activa</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalClients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-blue-600 text-lg"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-600 ml-1">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Posts Publicados</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPosts}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-paper-plane text-green-600 text-lg"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+8%</span>
            <span className="text-gray-600 ml-1">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Posts Programados</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.scheduledPosts}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-alt text-orange-600 text-lg"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-orange-600 font-medium">Pendientes</span>
            <span className="text-gray-600 ml-1">próximas 24h</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cuentas Conectadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.connectedAccounts}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-link text-purple-600 text-lg"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">Todas activas</span>
            <span className="text-gray-600 ml-1">OAuth conectado</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => router.push('/dashboard/clientes')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <i className="fas fa-users text-blue-600 text-lg"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gestionar Clientes</h3>
              <p className="text-sm text-gray-600">Agregar y configurar clientes</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/programacion')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md hover:border-green-300 transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <i className="fas fa-calendar-plus text-green-600 text-lg"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Programar Contenido</h3>
              <p className="text-sm text-gray-600">Crear y programar posts</p>
            </div>
          </div>
        </button>

        <button
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md hover:border-purple-300 transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <i className="fas fa-chart-line text-purple-600 text-lg"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ver Analíticas</h3>
              <p className="text-sm text-gray-600">Reportes y métricas</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todas <i className="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Post publicado en Facebook</p>
                <p className="text-xs text-gray-600">Cliente: Restaurante Los Sabores - Hace 2 horas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user-plus text-blue-600"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nuevo cliente agregado</p>
                <p className="text-xs text-gray-600">Tienda de Moda Bella - Hace 4 horas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <i className="fas fa-calendar text-orange-600"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">3 posts programados</p>
                <p className="text-xs text-gray-600">Para publicar mañana - Hace 6 horas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
