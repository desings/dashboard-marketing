"use client";

import { useState, useEffect } from 'react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  sidebarCollapsed?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ 
  title = "Dashboard", 
  subtitle = "Panel de Control",
  sidebarCollapsed = false 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`fixed top-0 right-0 z-30 bg-white shadow-sm border-b border-gray-200 transition-all duration-300 ${
      sidebarCollapsed ? 'left-16' : 'left-64'
    }`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Title Section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            
            {/* Current Time */}
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-gray-900">
                {isClient ? currentTime.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Cargando fecha...'}
              </div>
              <div className="text-xs text-gray-500">
                {isClient ? currentTime.toLocaleTimeString('es-ES') : 'Cargando hora...'}
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Quick Actions */}
            <div className="flex space-x-1">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Nueva publicación">
                <i className="fas fa-plus text-lg"></i>
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Búsqueda">
                <i className="fas fa-search text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;