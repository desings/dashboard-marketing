export default function PoliticaPrivacidad() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
      
      <div className="prose prose-lg text-gray-700 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Información que Recopilamos</h2>
          <p>
            Nuestra aplicación recopila y procesa los siguientes tipos de información:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Información de perfil básica de redes sociales (nombre, foto de perfil)</li>
            <li>Tokens de acceso para gestionar contenido en redes sociales</li>
            <li>Contenido de publicaciones que autoriza compartir</li>
            <li>Métricas de engagement de sus publicaciones</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Cómo Usamos su Información</h2>
          <p>
            Utilizamos su información únicamente para:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Gestionar y programar publicaciones en sus redes sociales</li>
            <li>Proporcionar análitics y métricas de rendimiento</li>
            <li>Mejorar nuestros servicios de marketing</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Compartir Información</h2>
          <p>
            No vendemos, alquilamos ni compartimos su información personal con terceros, 
            excepto en las siguientes circunstancias:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Con su consentimiento explícito</li>
            <li>Para cumplir con la ley o procesos legales</li>
            <li>Con proveedores de servicios que nos ayudan a operar nuestra plataforma</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Seguridad de Datos</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizacionales apropiadas 
            para proteger su información personal contra acceso no autorizado, alteración, 
            divulgación o destrucción.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Sus Derechos</h2>
          <p>
            Usted tiene derecho a:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Acceder a su información personal</li>
            <li>Rectificar datos inexactos</li>
            <li>Eliminar su cuenta y datos asociados</li>
            <li>Revocar permisos de acceso a redes sociales</li>
            <li>Portabilidad de sus datos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Retención de Datos</h2>
          <p>
            Conservamos su información personal solo durante el tiempo necesario 
            para cumplir con los fines descritos en esta política, 
            a menos que la ley requiera un período de retención más largo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contacto</h2>
          <p>
            Si tiene preguntas sobre esta Política de Privacidad, 
            contáctenos en: privacy@dashboard-marketing.com
          </p>
        </section>

        <section>
          <p className="text-sm text-gray-500 mt-8">
            Última actualización: 1 de enero de 2026
          </p>
        </section>
      </div>
    </div>
  )
}