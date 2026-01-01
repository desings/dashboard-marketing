"use client";
import DashboardLayout from '../../../components/DashboardLayout';

export default function AnalyticsPage() {
  return (
    <DashboardLayout 
      title="Analíticas" 
      subtitle="Visualiza el rendimiento de tus publicaciones"
    >
      <div className="space-y-6">
        
        {/* Coming Soon */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <i className="fas fa-chart-bar text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analíticas Avanzadas</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Próximamente podrás ver métricas detalladas de tus publicaciones, engagement, 
            alcance y mucho más. Esta funcionalidad estará disponible en la próxima actualización.
          </p>
          
          {/* Preview Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-eye text-white"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Alcance y Impresiones</h3>
              <p className="text-sm text-gray-600">Visualiza cuántas personas ven tu contenido</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-heart text-white"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Engagement</h3>
              <p className="text-sm text-gray-600">Mide likes, comentarios y shares</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-calendar-week text-white"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Reportes Semanales</h3>
              <p className="text-sm text-gray-600">Informes automáticos por cliente</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              💡 <strong>Tip:</strong> Mientras tanto, puedes revisar las métricas directamente 
              en cada plataforma social desde la sección de Programación.
            </p>
          </div>
        </div>
        
      </div>
    </DashboardLayout>
  );
}