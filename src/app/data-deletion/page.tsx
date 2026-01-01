'use client'

import React, { useState } from 'react'

export default function DataDeletion() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simular envío de solicitud
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSubmitted(true)
    } catch (error) {
      console.error('Error enviando solicitud:', error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Solicitud Enviada</h2>
            <p className="text-gray-600 mb-6">
              Su solicitud de eliminación de datos ha sido recibida. Procesaremos su solicitud dentro de 30 días.
            </p>
            <p className="text-sm text-gray-500">
              Recibirá una confirmación por email cuando el proceso esté completo.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Eliminación de Datos de Usuario</h1>
          
          <div className="prose prose-lg max-w-none mb-8">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Su Derecho a la Eliminación de Datos</h2>
              <p className="mb-4">
                De acuerdo con las regulaciones de protección de datos (GDPR, CCPA), usted tiene derecho a 
                solicitar la eliminación completa de todos sus datos personales de nuestros sistemas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Qué Datos se Eliminarán</h2>
              <p className="mb-4">
                Al solicitar la eliminación, removeremos permanentemente:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Su información de perfil y cuenta de usuario</li>
                <li>Todos los posts programados y publicados a través de nuestra plataforma</li>
                <li>Historial de publicaciones y métricas asociadas</li>
                <li>Configuraciones y preferencias de usuario</li>
                <li>Tokens de acceso y permisos de redes sociales</li>
                <li>Logs de actividad que contengan información personal identificable</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Proceso de Eliminación</h2>
              <ol className="list-decimal ml-6 mb-4">
                <li className="mb-2">Complete el formulario de solicitud a continuación</li>
                <li className="mb-2">Recibirá una confirmación por email dentro de 48 horas</li>
                <li className="mb-2">Verificaremos su identidad por motivos de seguridad</li>
                <li className="mb-2">Procederemos con la eliminación completa dentro de 30 días</li>
                <li className="mb-2">Le enviaremos una confirmación final cuando se complete</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Importante</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800">
                  <strong>Atención:</strong> Esta acción es irreversible. Una vez eliminados, 
                  sus datos no pueden ser recuperados. Asegúrese de descargar cualquier información 
                  que desee conservar antes de proceder.
                </p>
              </div>
              <p className="mb-4">
                Tenga en cuenta que algunos datos pueden permanecer en copias de seguridad por un período 
                adicional de hasta 90 días antes de ser eliminados permanentemente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Datos de Facebook</h2>
              <p className="mb-4">
                Para eliminar completamente los datos asociados con Facebook:
              </p>
              <ol className="list-decimal ml-6 mb-4">
                <li>Revoque los permisos de nuestra aplicación desde su configuración de Facebook</li>
                <li>Complete este formulario para eliminar datos de nuestros servidores</li>
              </ol>
              <p className="mb-4">
                También puede visitar 
                <a href="https://www.facebook.com/help/contact/2061665240770586" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {' '}el centro de ayuda de Facebook
                </a> para obtener más información sobre la eliminación de datos de aplicaciones.
              </p>
            </section>
          </div>

          {/* Formulario de Solicitud */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Eliminación de Datos</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email asociado con su cuenta *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@ejemplo.com"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Debe coincidir con el email de la cuenta que desea eliminar
                </p>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Motivo de eliminación (opcional)
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ayúdenos a mejorar describiéndonos por qué elimina su cuenta..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex">
                  <input
                    id="confirm-deletion"
                    type="checkbox"
                    required
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="confirm-deletion" className="ml-2 text-sm text-gray-700">
                    Confirmo que entiendo que esta acción eliminará permanentemente todos mis datos 
                    y no puede ser deshecha. He leído y acepto el proceso de eliminación descrito anteriormente.
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando solicitud...
                  </>
                ) : (
                  'Solicitar Eliminación de Datos'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                ¿Tiene preguntas? Contacte nuestro equipo de privacidad en{' '}
                <a href="mailto:privacy@dashboardmarketing.com" className="text-blue-600 hover:underline">
                  privacy@dashboardmarketing.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}