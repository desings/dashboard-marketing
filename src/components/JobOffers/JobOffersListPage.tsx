'use client'

import React, { useState, useEffect } from 'react'
import JobOfferDetailModal from './JobOfferDetailModal'

interface JobOffer {
  id: string
  title: string
  company: string
  location?: string
  salary?: string
  description?: string
  url: string
  portal: string
  status: 'ACTIVE' | 'DISCARDED' | 'INTERESTED_DAVID' | 'INTERESTED_IVAN'
  publishedAt: string
  scrapedAt: string
  companyProfile?: any
}

interface JobSearch {
  id: string
  keywords: string
  userId: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusColors = {
  ACTIVE: 'bg-gray-100 text-gray-800',
  DISCARDED: 'bg-red-100 text-red-800',
  INTERESTED_DAVID: 'bg-green-100 text-green-800',
  INTERESTED_IVAN: 'bg-blue-100 text-blue-800'
}

const statusLabels = {
  ACTIVE: 'Activa',
  DISCARDED: 'Descartada',
  INTERESTED_DAVID: 'Interesa a David',
  INTERESTED_IVAN: 'Interesa a Ivan'
}

export default function JobOffersListPage() {
  // Temporal: usar un userId fijo hasta implementar autenticación
  const userId = 'user-1'
  
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [jobSearches, setJobSearches] = useState<JobSearch[]>([])
  const [filters, setFilters] = useState({
    status: 'all',
    portal: 'all',
    search: '',
    jobSearchId: 'all'
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [showingSampleData, setShowingSampleData] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null)

  useEffect(() => {
    loadJobSearches()
  }, [])

  useEffect(() => {
    loadOffers()
  }, [filters, pagination.page])

  const loadJobSearches = async () => {
    try {
      const response = await fetch(`/api/job-searches?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setJobSearches(data.data || [])
      }
    } catch (error) {
      console.error('Error cargando búsquedas:', error)
    }
  }

  const loadOffers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.portal !== 'all' && { portal: filters.portal }),
        ...(filters.jobSearchId !== 'all' && { jobSearchId: filters.jobSearchId }),
        ...(filters.search && { search: filters.search })
      })

      const response = await fetch(`/api/job-offers?${params}`)
      const data = await response.json()

      if (data.success) {
        // Si no hay base de datos configurada, mostrar ofertas de ejemplo
        if (data.message && data.message.includes('Configura DATABASE_URL')) {
          console.log('⚠️ Base de datos no configurada, mostrando ofertas de ejemplo')
          setShowingSampleData(true)
          
          const sampleOffers: JobOffer[] = [
            {
              id: 'sample-1',
              title: 'Desarrollador Node.js Senior - Madrid',
              company: 'TechCorp Solutions',
              location: 'Madrid, España',
              salary: '45.000-55.000 €',
              description: 'Buscamos desarrollador Node.js con experiencia en APIs REST, MongoDB y AWS para nuestro equipo de backend.',
              url: 'https://www.infojobs.net/empleo-desarrollador-nodejs-senior-madrid',
              portal: 'infojobs',
              status: 'ACTIVE',
              publishedAt: new Date().toISOString(),
              scrapedAt: new Date().toISOString()
            },
            {
              id: 'sample-2',
              title: 'Full Stack Developer JavaScript - React/Node.js',
              company: 'StartupInnovadora',
              location: 'Barcelona, España',
              salary: '40.000-50.000 €',
              description: 'Oportunidad en startup para desarrollador full-stack con React, Node.js, TypeScript y experiencia en microservicios.',
              url: 'https://www.infojobs.net/empleo-fullstack-javascript-react-nodejs',
              portal: 'infojobs',
              status: 'ACTIVE',
              publishedAt: new Date(Date.now() - 3600000).toISOString(),
              scrapedAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 'sample-3',
              title: 'Backend Developer Node.js - Remoto',
              company: 'DigitalAgency Pro',
              location: 'Remoto, España',
              salary: '38.000-48.000 €',
              description: 'Desarrollador backend con Node.js, Express, PostgreSQL para proyectos de transformación digital.',
              url: 'https://www.infojobs.net/empleo-backend-nodejs-remoto',
              portal: 'infojobs',
              status: 'ACTIVE',
              publishedAt: new Date(Date.now() - 7200000).toISOString(),
              scrapedAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
              id: 'sample-4',
              title: 'JavaScript Developer - Vue.js y Node.js',
              company: 'WebSolutions Inc',
              location: 'Valencia, España',
              salary: '35.000-45.000 €',
              description: 'Desarrollador JavaScript para proyectos web con Vue.js en frontend y Node.js en backend.',
              url: 'https://www.infojobs.net/empleo-javascript-vue-nodejs',
              portal: 'infojobs',
              status: 'ACTIVE',
              publishedAt: new Date(Date.now() - 10800000).toISOString(),
              scrapedAt: new Date(Date.now() - 10800000).toISOString()
            },
            {
              id: 'sample-5',
              title: 'Node.js Architect - Microservicios',
              company: 'Enterprise Systems',
              location: 'Madrid, España',
              salary: '60.000-70.000 €',
              description: 'Arquitecto de software con amplia experiencia en Node.js, microservicios, Docker, Kubernetes.',
              url: 'https://www.infojobs.net/empleo-nodejs-architect-microservices',
              portal: 'infojobs',
              status: 'ACTIVE',
              publishedAt: new Date(Date.now() - 14400000).toISOString(),
              scrapedAt: new Date(Date.now() - 14400000).toISOString()
            }
          ]

          // Aplicar filtros a las ofertas de ejemplo
          let filteredSampleOffers = sampleOffers
          
          if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            filteredSampleOffers = sampleOffers.filter(offer => 
              offer.title.toLowerCase().includes(searchLower) ||
              offer.company.toLowerCase().includes(searchLower) ||
              offer.description?.toLowerCase().includes(searchLower)
            )
          }

          // Simular paginación
          const startIndex = (pagination.page - 1) * pagination.limit
          const endIndex = startIndex + pagination.limit
          const paginatedOffers = filteredSampleOffers.slice(startIndex, endIndex)

          setOffers(paginatedOffers)
          setPagination(prev => ({
            ...prev,
            total: filteredSampleOffers.length,
            totalPages: Math.ceil(filteredSampleOffers.length / pagination.limit)
          }))
        } else {
          // Datos reales de la base de datos
          setShowingSampleData(false)
          setOffers(data.data || [])
          setPagination(prev => ({
            ...prev,
            total: data.total || 0,
            totalPages: data.totalPages || 0
          }))
        }
      }
    } catch (error) {
      console.error('Error cargando ofertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (offerId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/job-offers/${offerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadOffers()
        const result = await response.json()
        
        if (newStatus.includes('INTERESTED')) {
          alert(`✅ ${result.message}${result.enrichmentStarted ? '\n🔍 Iniciando enriquecimiento de empresa...' : ''}`)
        } else {
          alert(`✅ ${result.message}`)
        }
      }
    } catch (error) {
      console.error('Error cambiando estado:', error)
      alert('❌ Error cambiando estado')
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Cargando ofertas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ofertas de Trabajo</h1>
        
        {showingSampleData && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">ℹ️</span>
              <div>
                <p className="text-blue-800 font-medium">Mostrando datos de ejemplo</p>
                <p className="text-blue-600 text-sm">
                  Estas ofertas demuestran el filtrado específico implementado. 
                  Configure la base de datos para ver ofertas reales de InfoJobs.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="DISCARDED">Descartadas</option>
            <option value="INTERESTED_DAVID">Interesa a David</option>
            <option value="INTERESTED_IVAN">Interesa a Ivan</option>
          </select>

          <select
            value={filters.portal}
            onChange={(e) => handleFilterChange('portal', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todos los portales</option>
            <option value="infojobs">InfoJobs</option>
          </select>

          <select
            value={filters.jobSearchId}
            onChange={(e) => handleFilterChange('jobSearchId', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todas las búsquedas</option>
            {jobSearches.map((search) => (
              <option key={search.id} value={search.id}>{search.keywords}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar por título o empresa..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 min-w-64"
          />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {offers.length} de {pagination.total} ofertas
          {pagination.totalPages > 1 && (
            <span> (Página {pagination.page} de {pagination.totalPages})</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {offers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No se encontraron ofertas con los filtros seleccionados</p>
            <button
              onClick={() => setFilters({ status: 'all', portal: 'all', search: '', jobSearchId: 'all' })}
              className="mt-2 text-blue-500 hover:text-blue-600"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {offers.map((offer) => (
              <div key={offer.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedOffer(offer)}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {offer.title}
                        </h3>
                        <p className="text-gray-600 font-medium">{offer.company}</p>
                        
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                          {offer.location && (
                            <span className="flex items-center">
                              📍 {offer.location}
                            </span>
                          )}
                          {offer.salary && (
                            <span className="flex items-center">
                              💰 {offer.salary}
                            </span>
                          )}
                          {offer.portal && (
                            <span className="flex items-center">
                              🌐 {offer.portal}
                            </span>
                          )}
                          {/* Mostrar tiempo de publicación si está disponible */}
                          {offer.publishedAt && offer.publishedAt !== 'Invalid Date' && (
                            <span className="flex items-center text-blue-600">
                              ⏰ {offer.publishedAt.includes('Hace') ? offer.publishedAt : `Publicado: ${new Date(offer.publishedAt).toLocaleDateString('es-ES')}`}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[offer.status]}`}
                          >
                            {statusLabels[offer.status]}
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            Scraped: {offer.scrapedAt && offer.scrapedAt !== 'Invalid Date' ? 
                              new Date(offer.scrapedAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Reciente'
                            }
                          </span>
                          {offer.companyProfile && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                              ✅ Empresa enriquecida
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      🔗 Ver oferta
                    </a>
                    
                    <select
                      value={offer.status}
                      onChange={(e) => handleStatusChange(offer.id, e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="ACTIVE">Activa</option>
                      <option value="DISCARDED">Descartar</option>
                      <option value="INTERESTED_DAVID">Interesa David</option>
                      <option value="INTERESTED_IVAN">Interesa Ivan</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
            >
              ← Anterior
            </button>
            
            <span className="text-sm text-gray-600">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {selectedOffer && (
        <JobOfferDetailModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}