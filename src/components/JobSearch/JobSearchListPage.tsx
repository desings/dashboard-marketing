'use client'

import React, { useState, useEffect } from 'react'
import JobSearchForm from './JobSearchForm'

interface JobSearch {
  id: string
  keywords: string
  portals: string[]
  frequencyMinutes: number
  isActive: boolean
  createdAt: string
  _count: {
    jobOffers: number
  }
}

interface JobSearchStats {
  totalSearches: number
  activeSearches: number
  totalOffers: number
  todayOffers: number
  offersByStatus: Record<string, number>
}

export default function JobSearchListPage() {
  const [jobSearches, setJobSearches] = useState<JobSearch[]>([])
  const [stats, setStats] = useState<JobSearchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingJobSearch, setEditingJobSearch] = useState<JobSearch | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [searchesResponse, statsResponse] = await Promise.all([
        fetch('/api/job-searches?userId=demo-user'),
        fetch('/api/job-searches/stats?userId=demo-user')
      ])

      const searchesData = await searchesResponse.json()
      const statsData = await statsResponse.json()

      if (searchesData.success) {
        setJobSearches(searchesData.data || [])
        if (searchesData.message && searchesData.message.includes('temporales')) {
          setIsInitializing(true)
          console.warn('⚠️ Datos temporales:', searchesData.message)
        }
      }

      if (statsData.success) {
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJobSearch = async (data: any) => {
    try {
      const response = await fetch('/api/job-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadData()
        setShowCreateForm(false)
        alert('✅ Búsqueda creada exitosamente')
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creando búsqueda:', error)
      alert('❌ Error creando búsqueda')
    }
  }

  const handleEditJobSearch = async (data: any) => {
    if (!editingJobSearch) return

    try {
      const response = await fetch(`/api/job-searches/${editingJobSearch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadData()
        setEditingJobSearch(null)
        alert('✅ Búsqueda actualizada exitosamente')
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error editando búsqueda:', error)
      alert('❌ Error editando búsqueda')
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/job-searches/${id}/toggle`, {
        method: 'POST'
      })

      if (response.ok) {
        await loadData()
        const result = await response.json()
        alert(`✅ ${result.message}`)
      }
    } catch (error) {
      console.error('Error cambiando estado:', error)
      alert('❌ Error cambiando estado')
    }
  }

  const handleManualScraping = async (id: string, keywords: string) => {
    try {
      alert('🔄 Iniciando scraping manual...')
      
      const response = await fetch(`/api/job-searches/${id}/scrape`, {
        method: 'POST'
      })

      const result = await response.json()
      if (response.ok) {
        await loadData()
        alert(`✅ ${result.message}`)
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error en scraping manual:', error)
      alert('❌ Error ejecutando scraping')
    }
  }

  const handleDelete = async (id: string, keywords: string) => {
    if (!confirm(`¿Estás seguro de eliminar la búsqueda "${keywords}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/job-searches/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
        alert('✅ Búsqueda eliminada exitosamente')
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error eliminando búsqueda:', error)
      alert('❌ Error eliminando búsqueda')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Cargando búsquedas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isInitializing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Módulo inicializándose</h3>
              <p className="mt-1 text-sm text-yellow-700">
                El módulo de búsqueda de clientes se está configurando. Algunas funciones pueden estar limitadas temporalmente.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Búsqueda de Clientes</h1>
            <p className="text-gray-600 mt-1">Automatiza la búsqueda de oportunidades laborales</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Nueva Búsqueda
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSearches}</div>
              <div className="text-sm text-gray-600">Búsquedas Total</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.activeSearches}</div>
              <div className="text-sm text-gray-600">Activas</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalOffers}</div>
              <div className="text-sm text-gray-600">Ofertas Total</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.todayOffers}</div>
              <div className="text-sm text-gray-600">Hoy</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.offersByStatus.INTERESTED_DAVID || 0}</div>
              <div className="text-sm text-gray-600">Interesantes</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Búsquedas Configuradas</h2>
          
          {jobSearches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay búsquedas configuradas</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-blue-500 hover:text-blue-600"
              >
                Crear tu primera búsqueda
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobSearches.map((search) => (
                <div
                  key={search.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{search.keywords}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            search.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {search.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {search._count.jobOffers} ofertas
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p><strong>Portales:</strong> {search.portals.join(', ')}</p>
                        <p><strong>Frecuencia:</strong> Cada {search.frequencyMinutes} minutos</p>
                        <p><strong>Creada:</strong> {new Date(search.createdAt).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleManualScraping(search.id, search.keywords)}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        title="Ejecutar scraping ahora"
                      >
                        🔍 Buscar
                      </button>
                      
                      <button
                        onClick={() => setEditingJobSearch(search)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        ✏️ Editar
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(search.id)}
                        className={`px-3 py-1 text-sm rounded ${
                          search.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {search.isActive ? '⏸️ Pausar' : '▶️ Activar'}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(search.id, search.keywords)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nueva Búsqueda</h2>
            <JobSearchForm
              onSubmit={handleCreateJobSearch}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {editingJobSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Editar Búsqueda</h2>
            <JobSearchForm
              initialData={editingJobSearch}
              onSubmit={handleEditJobSearch}
              onCancel={() => setEditingJobSearch(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}