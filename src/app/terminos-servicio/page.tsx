export default function TerminosServicio() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos de Servicio</h1>
      
      <div className="prose prose-lg text-gray-700 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar nuestro dashboard de marketing, usted acepta estar 
            sujeto a estos Términos de Servicio y todas las leyes y regulaciones aplicables.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Descripción del Servicio</h2>
          <p>
            Nuestro servicio proporciona una plataforma de gestión de marketing y redes sociales que permite:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Programar y publicar contenido en múltiples redes sociales</li>
            <li>Gestionar cuentas de clientes</li>
            <li>Analizar métricas de rendimiento</li>
            <li>Automatizar flujos de trabajo de marketing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Cuenta de Usuario</h2>
          <p>
            Para utilizar nuestro servicio, debe:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Proporcionar información precisa y completa</li>
            <li>Mantener la seguridad de su cuenta</li>
            <li>Notificar inmediatamente cualquier uso no autorizado</li>
            <li>Ser responsable de todas las actividades en su cuenta</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Uso Aceptable</h2>
          <p>
            Usted se compromete a NO utilizar el servicio para:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Violar leyes o regulaciones aplicables</li>
            <li>Publicar contenido ilegal, ofensivo o inapropiado</li>
            <li>Realizar actividades de spam o marketing no solicitado</li>
            <li>Interferir con la operación del servicio</li>
            <li>Acceder a sistemas o datos sin autorización</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Propiedad Intelectual</h2>
          <p>
            El servicio y su contenido original, características y funcionalidades 
            son y seguirán siendo propiedad exclusiva de nuestra empresa y sus licenciantes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Privacidad</h2>
          <p>
            Su privacidad es importante para nosotros. 
            Consulte nuestra <a href="/politica-privacidad" className="text-blue-600 hover:underline">
            Política de Privacidad</a> para entender cómo recopilamos, 
            utilizamos y protegemos su información.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitación de Responsabilidad</h2>
          <p>
            En ningún caso seremos responsables de daños indirectos, incidentales, 
            especiales, consecuenciales o punitivos, incluida la pérdida de beneficios, 
            datos, uso, buena voluntad u otras pérdidas intangibles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Terminación</h2>
          <p>
            Podemos terminar o suspender su acceso inmediatamente, sin previo aviso o responsabilidad, 
            por cualquier razón, incluido el incumplimiento de los Términos de Servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Cambios a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. 
            Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contacto</h2>
          <p>
            Si tiene preguntas sobre estos Términos de Servicio, 
            contáctenos en: legal@dashboard-marketing.com
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