'use client'

import React, { useState, useEffect } from 'react'
import JobOfferDetailModal from './JobOfferDetailModal'

interface JobOffer {
  id: string
  title: string
  company: string
  url: string
  salary?: string
  location?: string
  postedAt?: string
  status: 'ACTIVE' | 'DISCARDED' | 'INTERESTED_DAVID' | 'INTERESTED_IVAN'
  createdAt: string
  jobSearch: {
    keywords: string
  }
  companyProfile?: {
    name?: string
    website?: string
    email?: string
    phone?: string
    address?: string
  }
}

interface Props {
  jobSearchId?: string
}

const STATUS_LABELS = {
  ACTIVE: { label: 'Activa', color: 'bg-blue-100 text-blue-800' },
  DISCARDED: { label: 'Descartada', color: 'bg-gray-100 text-gray-800' },
  INTERESTED_DAVID: { label: 'Interés David', color: 'bg-green-100 text-green-800' },
  INTERESTED_IVAN: { label: 'Interés Iván', color: 'bg-purple-100 text-purple-800' }
}

export default function JobOffersListPage({ jobSearchId }: Props) {
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null)
  const [currentFilter, setCurrentFilter] = useState<string>('ACTIVE')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    loadOffers()
  }, [currentFilter, pagination.page, jobSearchId])

  const loadOffers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId: 'demo-user',
        status: currentFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (jobSearchId) {
        params.append('jobSearchId', jobSearchId)
      }

      const response = await fetch(`/api/job-offers?${params}`)
      const data = await response.json()

      if (data.success) {
        setOffers(data.data || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }))
      }
    } catch (error) {
      console.error('Error cargando ofertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOfferStatus = async (offerId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/job-offers/${offerId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadOffers()
        const result = await response.json()
        
        if (newStatus.includes('INTERESTED')) {
          alert(`✅ ${result.message}\n🔍 Iniciando enriquecimiento de empresa...`)
        }
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error actualizando status:', error)
      alert('❌ Error actualizando status')
    }
  }

  const deleteOffer = async (offerId: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar la oferta \"${title}\"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/job-offers/${offerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadOffers()
        alert('✅ Oferta eliminada exitosamente')
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error eliminando oferta:', error)
      alert('❌ Error eliminando oferta')
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  if (loading) {
    return (
      <div className=\"flex items-center justify-center py-12\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500\"></div>
        <span className=\"ml-2 text-gray-600\">Cargando ofertas...</span>
      </div>
    )
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"bg-white rounded-lg shadow p-6\">
        <h1 className=\"text-2xl font-bold text-gray-900 mb-4\">Ofertas de Trabajo</h1>
        
        {/* Filtros */}
        <div className=\"flex flex-wrap gap-2\">
          {Object.entries(STATUS_LABELS).map(([status, config]) => (
            <button
              key={status}
              onClick={() => {
                setCurrentFilter(status)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentFilter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Info de resultados */}
        <div className=\"mt-4 text-sm text-gray-600\">
          Mostrando {offers.length} de {pagination.total} ofertas
          {currentFilter !== 'ACTIVE' && ` · Filtro: ${STATUS_LABELS[currentFilter as keyof typeof STATUS_LABELS].label}`}
        </div>
      </div>

      {/* Lista de ofertas */}
      <div className=\"bg-white rounded-lg shadow\">
        {offers.length === 0 ? (
          <div className=\"p-8 text-center text-gray-500\">
            <p>No hay ofertas con el filtro actual</p>
            {currentFilter !== 'ACTIVE' && (
              <button
                onClick={() => setCurrentFilter('ACTIVE')}
                className=\"mt-2 text-blue-500 hover:text-blue-600\"
              >
                Ver todas las ofertas activas
              </button>
            )}
          </div>
        ) : (
          <div className=\"divide-y divide-gray-200\">
            {offers.map((offer) => (
              <div key={offer.id} className=\"p-6 hover:bg-gray-50 transition-colors\">
                <div className=\"flex items-start justify-between\">
                  <div className=\"flex-1 min-w-0 cursor-pointer\" onClick={() => setSelectedOffer(offer)}>
                    <div className=\"flex items-start space-x-3\">
                      <div className=\"flex-1\">
                        <h3 className=\"text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors\">
                          {offer.title}
                        </h3>
                        <p className=\"text-gray-600 font-medium\">{offer.company}</p>
                        
                        <div className=\"mt-2 flex flex-wrap gap-2 text-sm text-gray-500\">
                          {offer.location && (
                            <span className=\"flex items-center\">
                              📍 {offer.location}
                            </span>
                          )}
                          {offer.salary && (
                            <span className=\"flex items-center\">
                              💰 {offer.salary}
                            </span>
                          )}
                          {offer.postedAt && (
                            <span className=\"flex items-center\">
                              🕐 {offer.postedAt}
                            </span>
                          )}
                        </div>

                        <div className=\"mt-2 flex items-center space-x-2\">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_LABELS[offer.status].color}`}>
                            {STATUS_LABELS[offer.status].label}
                          </span>
                          <span className=\"px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full\">
                            {offer.jobSearch.keywords}
                          </span>
                          {offer.companyProfile && (
                            <span className=\"px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full\">
                              📊 Enriquecida
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className=\"flex flex-col space-y-2 ml-4\">
                    {offer.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => updateOfferStatus(offer.id, 'INTERESTED_DAVID')}
                          className=\"px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors\"
                        >
                          👍 Interesa David
                        </button>
                        <button
                          onClick={() => updateOfferStatus(offer.id, 'INTERESTED_IVAN')}
                          className=\"px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors\"
                        >
                          👍 Interesa Iván
                        </button>
                        <button
                          onClick={() => updateOfferStatus(offer.id, 'DISCARDED')}
                          className=\"px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors\"
                        >
                          👎 Descartar
                        </button>
                      </>
                    )}
                    
                    {offer.status !== 'ACTIVE' && (
                      <button
                        onClick={() => updateOfferStatus(offer.id, 'ACTIVE')}
                        className=\"px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors\"
                      >
                        🔄 Reactivar
                      </button>
                    )}

                    <a
                      href={offer.url}
                      target=\"_blank\"
                      rel=\"noopener noreferrer\"
                      className=\"px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-center\"
                    >
                      🔗 Ver Oferta
                    </a>

                    <button
                      onClick={() => deleteOffer(offer.id, offer.title)}
                      className=\"px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors\"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {pagination.pages > 1 && (
          <div className=\"px-6 py-4 border-t border-gray-200\">
            <div className=\"flex items-center justify-between\">
              <div className=\"text-sm text-gray-600\">
                Página {pagination.page} de {pagination.pages}
              </div>
              <div className=\"flex space-x-2\">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className=\"px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200\"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className=\"px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200\"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedOffer && (
        <JobOfferDetailModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onStatusUpdate={(offerId, status) => {
            updateOfferStatus(offerId, status)
            setSelectedOffer(null)
          }}
        />
      )}
    </div>
  )
}"