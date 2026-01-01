export default function EliminacionDatos() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Eliminación de Datos de Usuario</h1>
      
      <div className="prose prose-lg text-gray-700 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Solicitud de Eliminación de Datos</h2>
          <p>
            Respetamos su derecho a la privacidad y le proporcionamos control total sobre sus datos personales. 
            Puede solicitar la eliminación completa de su cuenta y todos los datos asociados en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">¿Qué Datos se Eliminarán?</h2>
          <p>
            Cuando solicite la eliminación, procederemos a eliminar permanentemente:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Su perfil de usuario y información de contacto</li>
            <li>Todas las cuentas de redes sociales conectadas</li>
            <li>Historial de publicaciones y contenido programado</li>
            <li>Métricas y analíticas de su cuenta</li>
            <li>Configuraciones y preferencias personalizadas</li>
            <li>Tokens de acceso y credenciales almacenadas</li>
            <li>Cualquier backup o copia de seguridad de sus datos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cómo Solicitar la Eliminación</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Método 1: Desde su Dashboard</strong><br/>
                  Vaya a Configuración → Cuenta → Eliminar Cuenta y siga las instrucciones.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong>Método 2: Por Email</strong><br/>
                  Envíe un correo a: <strong>delete@dashboard-marketing.com</strong><br/>
                  Incluya: Su email registrado y la palabra "ELIMINAR" en el asunto.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Método 3: Formulario de Contacto</strong><br/>
                  Complete nuestro formulario de solicitud de eliminación de datos en línea.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Proceso de Eliminación</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <p className="ml-3">
                <strong>Verificación (24-48 horas):</strong> Verificamos su identidad para proteger su cuenta.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <p className="ml-3">
                <strong>Período de gracia (7 días):</strong> Tiene 7 días para cancelar la solicitud si cambió de opinión.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <p className="ml-3">
                <strong>Eliminación completa (30 días):</strong> Procedemos con la eliminación permanente de todos sus datos.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</span>
              <p className="ml-3">
                <strong>Confirmación:</strong> Le enviamos un email confirmando la eliminación completa.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos que Pueden Conservarse</h2>
          <p>
            Por razones legales y de seguridad, podemos conservar temporalmente cierta información:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Registros de transacciones financieras (según ley fiscal)</li>
            <li>Logs de seguridad y auditoría (máximo 90 días)</li>
            <li>Datos anonimizados para análisis estadísticos</li>
            <li>Información requerida para cumplir con procesos legales activos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Exportar sus Datos Antes de Eliminar</h2>
          <p>
            Recomendamos exportar sus datos antes de solicitar la eliminación:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Vaya a Configuración → Exportar Datos</li>
            <li>Seleccione qué información desea descargar</li>
            <li>Recibirá un archivo ZIP con todos sus datos</li>
            <li>Este proceso puede tomar hasta 24 horas para cuentas grandes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contacto y Soporte</h2>
          <p>
            Si tiene preguntas sobre el proceso de eliminación de datos:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Email: <strong>delete@dashboard-marketing.com</strong></li>
            <li>Email general: <strong>support@dashboard-marketing.com</strong></li>
            <li>Tiempo de respuesta: 24-48 horas</li>
          </ul>
        </section>

        <section className="bg-red-50 border-l-4 border-red-400 p-4">
          <h2 className="text-xl font-semibold text-red-800 mb-4">⚠️ Importante</h2>
          <p className="text-red-700">
            <strong>La eliminación de datos es permanente e irreversible.</strong> Una vez confirmada, 
            no podremos recuperar su cuenta ni ninguno de sus datos. Asegúrese de haber exportado 
            toda la información importante antes de proceder.
          </p>
        </section>

        <section>
          <p className="text-sm text-gray-500 mt-8">
            Última actualización: 1 de enero de 2026<br/>
            Esta página cumple con GDPR, CCPA y regulaciones de privacidad aplicables.
          </p>
        </section>
      </div>
    </div>
  )
}