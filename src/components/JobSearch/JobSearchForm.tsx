'use client'

import React, { useState } from 'react'

interface JobSearchFormData {
  keywords: string
  portals: string[]
  frequencyMinutes: number
}

interface Props {
  initialData?: Partial<JobSearchFormData & { id: string }>
  onSubmit: (data: JobSearchFormData) => Promise<void>
  onCancel: () => void
}

const PORTALS = [
  { id: 'infojobs', name: 'InfoJobs', enabled: true },
  { id: 'linkedin', name: 'LinkedIn', enabled: false },
  { id: 'indeed', name: 'Indeed', enabled: false }
]

const FREQUENCY_OPTIONS = [
  { value: 60, label: 'Cada hora' },
  { value: 180, label: 'Cada 3 horas' },
  { value: 360, label: 'Cada 6 horas (recomendado)' },
  { value: 720, label: 'Cada 12 horas' },
  { value: 1440, label: 'Una vez al día' }
]

export default function JobSearchForm({ initialData, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<JobSearchFormData>({
    keywords: initialData?.keywords || '',
    portals: initialData?.portals || ['infojobs'],
    frequencyMinutes: initialData?.frequencyMinutes || 360
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.keywords.trim()) {
      alert('Por favor ingresa palabras clave para buscar')
      return
    }

    if (formData.portals.length === 0) {
      alert('Selecciona al menos un portal de búsqueda')
      return
    }

    setLoading(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error en formulario:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePortalToggle = (portalId: string) => {
    setFormData(prev => ({
      ...prev,
      portals: prev.portals.includes(portalId)
        ? prev.portals.filter(p => p !== portalId)
        : [...prev.portals, portalId]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className=\"space-y-4\">
      {/* Palabras clave */}
      <div>
        <label className=\"block text-sm font-medium text-gray-700 mb-2\">
          Palabras Clave *
        </label>
        <input
          type=\"text\"
          value={formData.keywords}
          onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
          placeholder=\"ej: desarrollador react, marketing digital, diseño gráfico\"
          className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
          disabled={loading}
        />
        <p className=\"text-xs text-gray-500 mt-1\">
          Usa palabras clave específicas para mejores resultados
        </p>
      </div>

      {/* Portales */}
      <div>
        <label className=\"block text-sm font-medium text-gray-700 mb-2\">
          Portales de Búsqueda *
        </label>
        <div className=\"space-y-2\">
          {PORTALS.map((portal) => (
            <label
              key={portal.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                portal.enabled
                  ? 'hover:bg-gray-50'
                  : 'bg-gray-50 cursor-not-allowed opacity-50'
              } ${
                formData.portals.includes(portal.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
            >
              <input
                type=\"checkbox\"
                checked={formData.portals.includes(portal.id)}
                onChange={() => portal.enabled && handlePortalToggle(portal.id)}
                disabled={!portal.enabled || loading}
                className=\"h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded\"
              />
              <span className=\"ml-3 text-sm font-medium text-gray-700\">
                {portal.name}
                {!portal.enabled && (
                  <span className=\"text-gray-400 text-xs ml-2\">(Próximamente)</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Frecuencia */}
      <div>
        <label className=\"block text-sm font-medium text-gray-700 mb-2\">
          Frecuencia de Búsqueda
        </label>
        <select
          value={formData.frequencyMinutes}
          onChange={(e) => setFormData(prev => ({ ...prev, frequencyMinutes: parseInt(e.target.value) }))}
          className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
          disabled={loading}
        >
          {FREQUENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className=\"text-xs text-gray-500 mt-1\">
          Recomendamos cada 6 horas para no sobrecargar los portales
        </p>
      </div>

      {/* Información adicional */}
      <div className=\"bg-blue-50 p-3 rounded-lg\">
        <h4 className=\"text-sm font-medium text-blue-800 mb-1\">ℹ️ Información</h4>
        <ul className=\"text-xs text-blue-700 space-y-1\">
          <li>• Las ofertas se buscarán automáticamente según la frecuencia configurada</li>
          <li>• Se evitan duplicados por URL de la oferta</li>
          <li>• Puedes ejecutar búsquedas manuales cuando quieras</li>
          <li>• Las ofertas interesantes se enriquecen automáticamente con datos de la empresa</li>
        </ul>
      </div>

      {/* Botones */}
      <div className=\"flex justify-end space-x-3 pt-4 border-t border-gray-200\">
        <button
          type=\"button\"
          onClick={onCancel}
          disabled={loading}
          className=\"px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50\"
        >
          Cancelar
        </button>
        <button
          type=\"submit\"
          disabled={loading}
          className=\"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed\"
        >
          {loading ? (
            <>
              <div className=\"animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2\"></div>
              {initialData?.id ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            initialData?.id ? 'Actualizar Búsqueda' : 'Crear Búsqueda'
          )}
        </button>
      </div>
    </form>
  )
}"