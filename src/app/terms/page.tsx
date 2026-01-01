import React from 'react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos de Servicio</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Aceptación de los Términos</h2>
              <p className="mb-4">
                Al acceder y usar Dashboard Marketing, usted acepta estar sujeto a estos términos de servicio 
                y todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, 
                no debe usar este servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Descripción del Servicio</h2>
              <p className="mb-4">
                Dashboard Marketing es una plataforma de gestión de redes sociales que permite:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Programar y publicar contenido en Facebook</li>
                <li>Gestionar múltiples cuentas de redes sociales</li>
                <li>Analizar métricas de publicaciones</li>
                <li>Automatizar procesos de marketing digital</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Registro y Cuentas de Usuario</h2>
              <p className="mb-4">
                Para usar nuestro servicio, debe:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Proporcionar información precisa y completa durante el registro</li>
                <li>Mantener la seguridad de su cuenta y contraseña</li>
                <li>Notificar inmediatamente cualquier uso no autorizado</li>
                <li>Ser responsable de toda la actividad en su cuenta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Uso Aceptable</h2>
              <p className="mb-4">
                Al usar Dashboard Marketing, usted se compromete a NO:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Publicar contenido ilegal, dañino, amenazante o abusivo</li>
                <li>Violar derechos de propiedad intelectual</li>
                <li>Usar el servicio para spam o actividades maliciosas</li>
                <li>Intentar acceder no autorizado a otros sistemas</li>
                <li>Interferir con el funcionamiento del servicio</li>
                <li>Violar las políticas de Facebook o otras redes sociales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Contenido del Usuario</h2>
              <p className="mb-4">
                Usted es completamente responsable del contenido que publica a través de nuestro servicio:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Debe tener todos los derechos necesarios para publicar el contenido</li>
                <li>El contenido debe cumplir con todas las leyes aplicables</li>
                <li>Nos otorga una licencia limitada para procesar y publicar su contenido</li>
                <li>Podemos remover contenido que viole estos términos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Integración con Facebook</h2>
              <p className="mb-4">
                Nuestro servicio se integra con Facebook:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Debe cumplir con los Términos de Servicio de Facebook</li>
                <li>Facebook puede suspender o limitar el acceso en cualquier momento</li>
                <li>No somos responsables por cambios en las políticas de Facebook</li>
                <li>Los permisos de Facebook pueden revocarse desde su configuración</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Disponibilidad del Servicio</h2>
              <p className="mb-4">
                Aunque nos esforzamos por mantener el servicio disponible 24/7:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Puede haber interrupciones temporales por mantenimiento</li>
                <li>No garantizamos un tiempo de actividad específico</li>
                <li>Podemos modificar o descontinuar características con aviso previo</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Limitación de Responsabilidad</h2>
              <p className="mb-4">
                Dashboard Marketing no será responsable por:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Daños directos, indirectos, incidentales o consecuenciales</li>
                <li>Pérdida de datos, ganancias o oportunidades comerciales</li>
                <li>Interrupciones del servicio de terceros (Facebook, etc.)</li>
                <li>Uso inadecuado del servicio por parte del usuario</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Terminación</h2>
              <p className="mb-4">
                Podemos terminar su acceso al servicio:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Por violación de estos términos</li>
                <li>Por actividad fraudulenta o abusiva</li>
                <li>Con aviso previo por razones operativas</li>
              </ul>
              <p className="mb-4">
                Usted puede terminar su cuenta en cualquier momento eliminando su acceso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Modificaciones</h2>
              <p className="mb-4">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Las modificaciones serán efectivas al ser publicadas en esta página. 
                El uso continuado del servicio constituye aceptación de los nuevos términos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Ley Aplicable</h2>
              <p className="mb-4">
                Estos términos se rigen por las leyes de España y la Unión Europea. 
                Cualquier disputa será resuelta en los tribunales competentes de España.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Contacto</h2>
              <p className="mb-4">
                Para preguntas sobre estos términos de servicio:
              </p>
              <ul className="list-none mb-4">
                <li>Email: legal@dashboardmarketing.com</li>
                <li>Dirección: España</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}