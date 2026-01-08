"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  currentPath?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath = '' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['clientes']); // Expandir Clientes por defecto
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedTenant');
    router.push('/login');
  };

  const toggleSubMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const menuItems = [
    {
      id: 'dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      path: '/dashboard',
      active: currentPath === '/dashboard'
    },
    {
      id: 'clientes',
      icon: 'fas fa-users',
      label: 'Clientes',
      path: '/dashboard/clientes',
      active: currentPath.includes('/clientes'),
      hasSubmenu: true,
      subItems: [
        {
          icon: 'fas fa-list',
          label: 'Lista de Clientes',
          path: '/dashboard/clientes',
          active: currentPath === '/dashboard/clientes'
        },
        {
          icon: 'fas fa-search',
          label: 'Búsqueda Clientes',
          path: '/dashboard/clientes/busqueda',
          active: currentPath.includes('/clientes/busqueda')
        },
        {
          icon: 'fas fa-briefcase',
          label: 'Ofertas Trabajo',
          path: '/dashboard/clientes/ofertas',
          active: currentPath.includes('/clientes/ofertas')
        }
      ]
    },
    {
      id: 'programacion',
      icon: 'fas fa-calendar-alt',
      label: 'Programación',
      path: '/dashboard/programacion',
      active: currentPath.includes('/programacion')
    },
    {
      id: 'analytics',
      icon: 'fas fa-chart-bar',
      label: 'Analíticas',
      path: '/dashboard/analytics',
      active: currentPath.includes('/analytics')
    },
    {
      id: 'settings',
      icon: 'fas fa-cogs',
      label: 'Configuración',
      path: '/dashboard/settings',
      active: currentPath.includes('/settings')
    }
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-50 h-full bg-slate-800 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-rocket text-white text-sm"></i>
              </div>
              <span className="text-white font-bold text-lg">Marketing CRM</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        {/* User Profile */}
        {!isCollapsed && user && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-slate-400 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                {item.hasSubmenu ? (
                  // Menú con submenús
                  <div>
                    <button
                      onClick={() => toggleSubMenu(item.id)}
                      className={`w-full flex items-center justify-between space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                        item.active
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <i className={`${item.icon} ${isCollapsed ? 'text-center w-full' : 'w-5'}`}></i>
                        {!isCollapsed && <span className="font-medium">{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        <i className={`fas fa-chevron-${expandedMenus.includes(item.id) ? 'down' : 'right'} text-xs`}></i>
                      )}
                    </button>
                    
                    {/* Submenú */}
                    {!isCollapsed && expandedMenus.includes(item.id) && item.subItems && (
                      <ul className="mt-2 ml-4 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.path}>
                            <button
                              onClick={() => router.push(subItem.path)}
                              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 text-sm ${
                                subItem.active
                                  ? 'bg-blue-500 text-white shadow'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              <i className={`${subItem.icon} w-4`}></i>
                              <span>{subItem.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Menú simple
                  <button
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                      item.active
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <i className={`${item.icon} ${isCollapsed ? 'text-center w-full' : 'w-5'}`}></i>
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-all duration-200"
          >
            <i className={`fas fa-sign-out-alt ${isCollapsed ? 'text-center w-full' : 'w-5'}`}></i>
            {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
};

export default Sidebar;