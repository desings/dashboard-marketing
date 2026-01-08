'use client'

import React, { useState } from 'react'

interface JobSearchFormData {
  keywords: string
  portals: string[]
  frequencyMinutes: number
  userId: string
}

interface JobSearchFormProps {
  initialData?: any
  onSubmit: (data: JobSearchFormData) => void
  onCancel: () => void
}

const availablePortals = [
  { value: 'infojobs', label: 'InfoJobs' }
]

const frequencyOptions = [
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 240, label: '4 horas' },
  { value: 480, label: '8 horas' },
  { value: 1440, label: '24 horas' }
]

export default function JobSearchForm({ initialData, onSubmit, onCancel }: JobSearchFormProps) {
  const [formData, setFormData] = useState<JobSearchFormData>({
    keywords: initialData?.keywords || '',
    portals: initialData?.portals || ['infojobs'],
    frequencyMinutes: initialData?.frequencyMinutes || 240,
    userId: 'demo-user'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}

    if (!formData.keywords.trim()) {
      newErrors.keywords = 'Las palabras clave son obligatorias'
    }

    if (formData.keywords.length < 3) {
      newErrors.keywords = 'Mínimo 3 caracteres'
    }

    if (formData.portals.length === 0) {
      newErrors.portals = 'Selecciona al menos un portal'
    }

    if (formData.frequencyMinutes < 60) {
      newErrors.frequency = 'La frecuencia mínima es de 60 minutos'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Palabras Clave *
        </label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="ej: desarrollador react, frontend developer"
        />
        {errors.keywords && (
          <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Portales de Búsqueda *
        </label>
        <div className="space-y-2">
          {availablePortals.map((portal) => (
            <label key={portal.value} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.portals.includes(portal.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({ 
                      ...prev, 
                      portals: [...prev.portals, portal.value] 
                    }))
                  } else {
                    setFormData(prev => ({ 
                      ...prev, 
                      portals: prev.portals.filter(p => p !== portal.value) 
                    }))
                  }
                }}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900">{portal.label}</span>
            </label>
          ))}
        </div>
        {errors.portals && (
          <p className="mt-1 text-sm text-red-600">{errors.portals}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frecuencia de Búsqueda
        </label>
        <select
          value={formData.frequencyMinutes}
          onChange={(e) => setFormData(prev => ({ ...prev, frequencyMinutes: Number(e.target.value) }))}
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {frequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.frequency && (
          <p className="mt-1 text-sm text-red-600">{errors.frequency}</p>
        )}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>ℹ️ Configuración recomendada:</strong><br />
          • Usa términos específicos para mejores resultados<br />
          • La frecuencia de 4 horas equilibra actualidad y recursos<br />
          • Las ofertas se clasificarán automáticamente como "Activas"
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600"
        >
          {initialData ? 'Actualizar' : 'Crear'} Búsqueda
        </button>
      </div>
    </form>
  )
}