import React from 'react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Información que Recopilamos</h2>
              <p className="mb-4">
                Dashboard Marketing recopila la siguiente información:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Información de perfil de Facebook (nombre, ID de usuario)</li>
                <li>Permisos de acceso a páginas de Facebook autorizadas por el usuario</li>
                <li>Contenido de publicaciones programadas y publicadas</li>
                <li>Datos de uso de la aplicación (analytics básicos)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Cómo Usamos la Información</h2>
              <p className="mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Permitir la programación y publicación de contenido en Facebook</li>
                <li>Gestionar y programar publicaciones en redes sociales</li>
                <li>Proporcionar análisis y métricas de publicaciones</li>
                <li>Mejorar la funcionalidad de la aplicación</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Compartir Información</h2>
              <p className="mb-4">
                No vendemos, comercializamos o transferimos su información personal a terceros, excepto:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Cuando es necesario para proporcionar el servicio (ej: publicar en Facebook)</li>
                <li>Cuando es requerido por ley</li>
                <li>Para proteger nuestros derechos legales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Seguridad de Datos</h2>
              <p className="mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Cifrado de datos en tránsito y en reposo</li>
                <li>Acceso limitado a información personal</li>
                <li>Auditorías regulares de seguridad</li>
                <li>Autenticación segura con Facebook OAuth</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Retención de Datos</h2>
              <p className="mb-4">
                Conservamos su información personal solo durante el tiempo necesario para:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Proporcionar nuestros servicios</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Resolver disputas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Sus Derechos</h2>
              <p className="mb-4">
                Usted tiene derecho a:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Acceder a su información personal</li>
                <li>Rectificar información inexacta</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Revocar permisos de Facebook en cualquier momento</li>
                <li>Exportar sus datos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Datos de Facebook</h2>
              <p className="mb-4">
                Esta aplicación utiliza la API de Facebook. Los datos obtenidos de Facebook se utilizan únicamente para:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Autenticación de usuarios</li>
                <li>Publicación de contenido autorizado</li>
                <li>Gestión de páginas autorizadas</li>
              </ul>
              <p className="mb-4">
                Para eliminar todos los datos asociados con Facebook, puede revocar los permisos de la aplicación 
                desde su configuración de Facebook o solicitar eliminación a través de nuestro proceso de eliminación de datos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Contacto</h2>
              <p className="mb-4">
                Para preguntas sobre esta política de privacidad o para ejercer sus derechos, contáctenos:
              </p>
              <ul className="list-none mb-4">
                <li>Email: privacy@dashboardmarketing.com</li>
                <li>Dirección: España</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Cambios en la Política</h2>
              <p className="mb-4">
                Nos reservamos el derecho de actualizar esta política de privacidad. Los cambios significativos 
                serán notificados a través de la aplicación o por email.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}