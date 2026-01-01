import Link from 'next/link'

export default function FacebookSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🔧 Configuración de Permisos de Facebook
            </h1>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              ✅ <strong>¡Token "FB TOKEN" configurado!</strong> Si aún ves errores, revisa los pasos abajo.
            </div>
            <p className="text-gray-600">
              Guía de resolución de problemas para Facebook
            </p>
          </div>

          <div className="space-y-8">
            {/* Problem Explanation */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-3 flex items-center gap-2">
                ⚠️ Problema Actual
              </h2>
              <p className="text-red-700">
                Tu token de Facebook no tiene los permisos necesarios para publicar. Facebook requiere 
                permisos específicos para publicar en páginas o en el feed del usuario.
              </p>
            </div>

            {/* Required Permissions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-3">
                📋 Permisos Necesarios
              </h2>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <code className="bg-blue-100 px-2 py-1 rounded">pages_read_engagement</code> - Para leer información de páginas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <code className="bg-blue-100 px-2 py-1 rounded">pages_manage_posts</code> - Para publicar en páginas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <code className="bg-blue-100 px-2 py-1 rounded">publish_to_groups</code> - Para publicar en grupos (opcional)
                </li>
              </ul>
            </div>

            {/* Step by Step Guide */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🚀 Pasos para Solucionar
              </h2>

              {/* Step 1 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="text-lg font-semibold">Accede al Panel de Desarrolladores de Facebook</h3>
                </div>
                <ol className="space-y-2 text-gray-600 ml-11">
                  <li>• Ve a <a href="https://developers.facebook.com" className="text-blue-600 hover:underline" target="_blank">developers.facebook.com</a></li>
                  <li>• Inicia sesión con tu cuenta de Facebook</li>
                  <li>• Selecciona tu aplicación: <strong>ID: 1314977153875955</strong></li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="text-lg font-semibold">Configura los Permisos</h3>
                </div>
                <ol className="space-y-2 text-gray-600 ml-11">
                  <li>• Ve a <strong>App Review → Permissions and Features</strong></li>
                  <li>• Busca y solicita: <code>pages_read_engagement</code></li>
                  <li>• Busca y solicita: <code>pages_manage_posts</code></li>
                  <li>• Proporciona una justificación de uso para cada permiso</li>
                </ol>
              </div>

              {/* Step 3 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="text-lg font-semibold">Genera un Nuevo Token</h3>
                </div>
                <ol className="space-y-2 text-gray-600 ml-11">
                  <li>• Ve a <strong>Tools → Graph API Explorer</strong></li>
                  <li>• Selecciona tu aplicación</li>
                  <li>• En <strong>Permissions</strong>, agrega los nuevos permisos</li>
                  <li>• Genera un nuevo <strong>User Access Token</strong></li>
                  <li>• Intercambialo por un token de larga duración</li>
                </ol>
              </div>

              {/* Step 4 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <h3 className="text-lg font-semibold">Actualiza el Token en el Dashboard</h3>
                </div>
                <ol className="space-y-2 text-gray-600 ml-11">
                  <li>• Copia el nuevo token de larga duración</li>
                  <li>• Actualiza la variable <code>FACEBOOK_ACCESS_TOKEN</code> en tu archivo <code>.env</code></li>
                  <li>• Reinicia la aplicación</li>
                  <li>• Desactiva el "Modo de Prueba" y haz una publicación real</li>
                </ol>
              </div>
            </div>

            {/* Alternative Solution */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-3 flex items-center gap-2">
                💡 Alternativa Temporal
              </h2>
              <p className="text-green-700 mb-3">
                Mientras configuras los permisos, puedes usar el <strong>Modo de Prueba</strong> para:
              </p>
              <ul className="space-y-1 text-green-700">
                <li>• ✅ Probar toda la interfaz del dashboard</li>
                <li>• ✅ Verificar que los flujos de trabajo funcionan</li>
                <li>• ✅ Entrenar a tu equipo en el uso del sistema</li>
                <li>• ✅ Desarrollar contenido sin publicar accidentalmente</li>
              </ul>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                ⚠️ Notas Importantes
              </h2>
              <ul className="space-y-2 text-yellow-700">
                <li>• Facebook puede tomar varios días en revisar los permisos de aplicación</li>
                <li>• Para aplicaciones en producción, necesitarás completar el proceso de revisión</li>
                <li>• Los tokens de desarrollador tienen limitaciones y pueden expirar</li>
                <li>• Recomendamos crear una página de Facebook para pruebas</li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                🔗 Enlaces Útiles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a href="https://developers.facebook.com" className="text-blue-600 hover:underline" target="_blank">
                  → Panel de Desarrolladores
                </a>
                <a href="https://developers.facebook.com/tools/explorer/" className="text-blue-600 hover:underline" target="_blank">
                  → Graph API Explorer
                </a>
                <a href="https://developers.facebook.com/docs/permissions/reference" className="text-blue-600 hover:underline" target="_blank">
                  → Documentación de Permisos
                </a>
                <a href="https://developers.facebook.com/docs/pages/publishing" className="text-blue-600 hover:underline" target="_blank">
                  → Guía de Publicación en Páginas
                </a>
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center pt-6">
              <Link 
                href="/dashboard/programacion" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ← Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}