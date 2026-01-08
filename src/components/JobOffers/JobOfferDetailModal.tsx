'use client'

import React, { useState, useEffect } from 'react'

interface JobOffer {
  id: string
  title: string
  company: string
  url: string
  salary?: string
  location?: string
  postedAt?: string
  description?: string
  status: 'ACTIVE' | 'DISCARDED' | 'INTERESTED_DAVID' | 'INTERESTED_IVAN'
  createdAt: string
  jobSearch: {
    keywords: string
    userId: string
  }
  companyProfile?: {
    name?: string
    website?: string
    email?: string
    phone?: string
    address?: string
    source?: string
  }
}

interface Props {
  offer: JobOffer
  onClose: () => void
  onStatusUpdate: (offerId: string, status: string) => void
}

const STATUS_LABELS = {
  ACTIVE: { label: 'Activa', color: 'bg-blue-100 text-blue-800' },
  DISCARDED: { label: 'Descartada', color: 'bg-gray-100 text-gray-800' },
  INTERESTED_DAVID: { label: 'Interés David', color: 'bg-green-100 text-green-800' },
  INTERESTED_IVAN: { label: 'Interés Iván', color: 'bg-purple-100 text-purple-800' }
}

export default function JobOfferDetailModal({ offer: initialOffer, onClose, onStatusUpdate }: Props) {
  const [offer, setOffer] = useState<JobOffer>(initialOffer)
  const [loading, setLoading] = useState(false)

  // Recargar datos completos de la oferta
  useEffect(() => {
    loadOfferDetails()
  }, [initialOffer.id])

  const loadOfferDetails = async () => {
    try {
      const response = await fetch(`/api/job-offers/${initialOffer.id}`)
      const data = await response.json()

      if (data.success) {
        setOffer(data.data)
      }
    } catch (error) {
      console.error('Error cargando detalles:', error)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true)
    try {
      onStatusUpdate(offer.id, newStatus)
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\"
      onClick={handleBackdropClick}
    >
      <div className=\"bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto\">
        {/* Header */}
        <div className=\"sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg\">
          <div className=\"flex items-start justify-between\">
            <div className=\"flex-1\">
              <h2 className=\"text-xl font-bold text-gray-900\">{offer.title}</h2>
              <p className=\"text-lg text-gray-600 mt-1\">{offer.company}</p>
              
              <div className=\"flex items-center space-x-2 mt-3\">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_LABELS[offer.status].color}`}>
                  {STATUS_LABELS[offer.status].label}
                </span>
                <span className=\"px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full\">
                  {offer.jobSearch.keywords}
                </span>
                {offer.companyProfile && (
                  <span className=\"px-3 py-1 text-sm bg-green-100 text-green-600 rounded-full\">
                    📊 Datos de empresa
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className=\"ml-4 text-gray-400 hover:text-gray-600 text-2xl\"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className=\"p-6 space-y-6\">
          {/* Información básica */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
            {/* Detalles de la oferta */}
            <div className=\"space-y-4\">
              <h3 className=\"text-lg font-semibold text-gray-900\">Detalles de la Oferta</h3>
              
              <div className=\"space-y-3\">
                {offer.location && (
                  <div className=\"flex items-start space-x-2\">
                    <span className=\"text-gray-400\">📍</span>
                    <div>
                      <span className=\"text-sm font-medium text-gray-700\">Ubicación:</span>
                      <p className=\"text-gray-900\">{offer.location}</p>
                    </div>
                  </div>
                )}

                {offer.salary && (
                  <div className=\"flex items-start space-x-2\">
                    <span className=\"text-gray-400\">💰</span>
                    <div>
                      <span className=\"text-sm font-medium text-gray-700\">Salario:</span>
                      <p className=\"text-gray-900\">{offer.salary}</p>
                    </div>
                  </div>
                )}

                {offer.postedAt && (
                  <div className=\"flex items-start space-x-2\">
                    <span className=\"text-gray-400\">🕐</span>
                    <div>
                      <span className=\"text-sm font-medium text-gray-700\">Publicada:</span>
                      <p className=\"text-gray-900\">{offer.postedAt}</p>
                    </div>
                  </div>
                )}

                <div className=\"flex items-start space-x-2\">
                  <span className=\"text-gray-400\">📅</span>
                  <div>
                    <span className=\"text-sm font-medium text-gray-700\">Encontrada:</span>
                    <p className=\"text-gray-900\">{new Date(offer.createdAt).toLocaleString('es-ES')}</p>
                  </div>
                </div>

                <div className=\"flex items-start space-x-2\">
                  <span className=\"text-gray-400\">🔗</span>
                  <div>
                    <span className=\"text-sm font-medium text-gray-700\">URL:</span>
                    <a
                      href={offer.url}
                      target=\"_blank\"
                      rel=\"noopener noreferrer\"
                      className=\"text-blue-500 hover:text-blue-600 break-all\"
                    >
                      Ver oferta original →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de la empresa */}
            <div className=\"space-y-4\">
              <h3 className=\"text-lg font-semibold text-gray-900\">Información de la Empresa</h3>
              
              {offer.companyProfile ? (
                <div className=\"bg-green-50 border border-green-200 rounded-lg p-4 space-y-3\">
                  <div className=\"flex items-center space-x-2\">
                    <span className=\"text-green-600\">✅</span>
                    <span className=\"text-sm font-medium text-green-800\">
                      Datos enriquecidos automáticamente
                    </span>
                  </div>

                  {offer.companyProfile.name && (
                    <div>
                      <span className=\"text-sm font-medium text-gray-700\">Nombre:</span>
                      <p className=\"text-gray-900\">{offer.companyProfile.name}</p>
                    </div>
                  )}

                  {offer.companyProfile.website && (
                    <div>
                      <span className=\"text-sm font-medium text-gray-700\">Website:</span>
                      <a
                        href={offer.companyProfile.website}
                        target=\"_blank\"
                        rel=\"noopener noreferrer\"
                        className=\"text-blue-500 hover:text-blue-600 break-all\"
                      >
                        {offer.companyProfile.website}
                      </a>
                    </div>
                  )}

                  {offer.companyProfile.email && (
                    <div>
                      <span className=\"text-sm font-medium text-gray-700\">Email:</span>
                      <a
                        href={`mailto:${offer.companyProfile.email}`}
                        className=\"text-blue-500 hover:text-blue-600\"
                      >
                        {offer.companyProfile.email}
                      </a>
                    </div>
                  )}

                  {offer.companyProfile.phone && (
                    <div>
                      <span className=\"text-sm font-medium text-gray-700\">Teléfono:</span>
                      <a
                        href={`tel:${offer.companyProfile.phone}`}
                        className=\"text-blue-500 hover:text-blue-600\"
                      >
                        {offer.companyProfile.phone}
                      </a>
                    </div>
                  )}

                  {offer.companyProfile.address && (
                    <div>
                      <span className=\"text-sm font-medium text-gray-700\">Dirección:</span>
                      <p className=\"text-gray-900\">{offer.companyProfile.address}</p>
                    </div>
                  )}

                  <div className=\"text-xs text-green-600\">
                    Fuente: {offer.companyProfile.source || 'scraping'}
                  </div>
                </div>
              ) : (
                <div className=\"bg-yellow-50 border border-yellow-200 rounded-lg p-4\">
                  <div className=\"flex items-center space-x-2\">
                    <span className=\"text-yellow-600\">⏳</span>
                    <span className=\"text-sm font-medium text-yellow-800\">
                      Sin datos adicionales de empresa
                    </span>
                  </div>
                  <p className=\"text-sm text-yellow-700 mt-2\">
                    Los datos se enriquecen automáticamente cuando marcas una oferta como interesante.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          {offer.description && (
            <div>
              <h3 className=\"text-lg font-semibold text-gray-900 mb-3\">Descripción</h3>
              <div className=\"bg-gray-50 rounded-lg p-4\">
                <p className=\"text-gray-700 whitespace-pre-wrap\">{offer.description}</p>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className=\"border-t border-gray-200 pt-6\">
            <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Acciones</h3>
            
            <div className=\"flex flex-wrap gap-3\">
              {offer.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('INTERESTED_DAVID')}
                    disabled={loading}
                    className=\"px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50\"
                  >
                    👍 Me interesa (David)
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('INTERESTED_IVAN')}
                    disabled={loading}
                    className=\"px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50\"
                  >
                    👍 Me interesa (Iván)
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('DISCARDED')}
                    disabled={loading}
                    className=\"px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50\"
                  >
                    👎 Descartar
                  </button>
                </>
              )}
              
              {offer.status !== 'ACTIVE' && (
                <button
                  onClick={() => handleStatusUpdate('ACTIVE')}
                  disabled={loading}
                  className=\"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50\"
                >
                  🔄 Marcar como activa
                </button>
              )}

              <a
                href={offer.url}
                target=\"_blank\"
                rel=\"noopener noreferrer\"
                className=\"px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200\"
              >
                🔗 Ver oferta completa
              </a>

              {offer.companyProfile?.website && (
                <a
                  href={offer.companyProfile.website}
                  target=\"_blank\"
                  rel=\"noopener noreferrer\"
                  className=\"px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200\"
                >
                  🌐 Visitar empresa
                </a>
              )}

              {offer.companyProfile?.email && (
                <a
                  href={`mailto:${offer.companyProfile.email}`}
                  className=\"px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200\"
                >
                  ✉️ Contactar por email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}"