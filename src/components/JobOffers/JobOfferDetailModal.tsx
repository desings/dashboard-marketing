'use client'

import React from 'react'

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
  companyProfile?: {
    name: string
    website?: string
    description?: string
    industry?: string
    size?: string
    location?: string
    linkedinUrl?: string
    enrichedAt: string
  }
}

interface JobOfferDetailModalProps {
  offer: JobOffer
  onClose: () => void
  onStatusChange: (offerId: string, newStatus: string) => void
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

export default function JobOfferDetailModal({ offer, onClose, onStatusChange }: JobOfferDetailModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Fecha no disponible'
    }
    
    // Si es un string como "Hace X días", devolverlo tal como está
    if (dateString.includes('Hace')) {
      return dateString
    }
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Fecha no disponible'
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Fecha no disponible'
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Detalle de la Oferta</h2>
          <div className="flex items-center space-x-3">
            <select
              value={offer.status}
              onChange={(e) => onStatusChange(offer.id, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ACTIVE">Activa</option>
              <option value="DISCARDED">Descartar</option>
              <option value="INTERESTED_DAVID">Interesa a David</option>
              <option value="INTERESTED_IVAN">Interesa a Ivan</option>
            </select>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h1>
              <p className="text-lg text-gray-700 font-medium">{offer.company}</p>
              
              <div className="flex items-center space-x-2 mt-3">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[offer.status]}`}
                >
                  {statusLabels[offer.status]}
                </span>
                <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
                  📅 {formatDate(offer.publishedAt)}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                🔗 Ver Oferta Original
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Información de la Oferta</h3>
                <div className="space-y-2">
                  {offer.location && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-600 w-20">📍 Ubicación:</span>
                      <span className="text-gray-900">{offer.location}</span>
                    </div>
                  )}
                  {offer.salary && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-600 w-20">💰 Salario:</span>
                      <span className="text-gray-900">{offer.salary}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-20">🌐 Portal:</span>
                    <span className="text-gray-900">{offer.portal}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-20">📊 Scraped:</span>
                    <span className="text-gray-900">{formatDate(offer.scrapedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {offer.companyProfile && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    ✅ Información de la Empresa
                    <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      Enriquecida
                    </span>
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-600">Nombre:</span>
                      <span className="ml-2 text-gray-900">{offer.companyProfile.name}</span>
                    </div>
                    {offer.companyProfile.industry && (
                      <div>
                        <span className="font-medium text-gray-600">Industria:</span>
                        <span className="ml-2 text-gray-900">{offer.companyProfile.industry}</span>
                      </div>
                    )}
                    {offer.companyProfile.size && (
                      <div>
                        <span className="font-medium text-gray-600">Tamaño:</span>
                        <span className="ml-2 text-gray-900">{offer.companyProfile.size}</span>
                      </div>
                    )}
                    {offer.companyProfile.location && (
                      <div>
                        <span className="font-medium text-gray-600">Ubicación:</span>
                        <span className="ml-2 text-gray-900">{offer.companyProfile.location}</span>
                      </div>
                    )}
                    {offer.companyProfile.website && (
                      <div>
                        <span className="font-medium text-gray-600">Web:</span>
                        <a
                          href={offer.companyProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-500 hover:text-blue-600 underline"
                        >
                          {offer.companyProfile.website}
                        </a>
                      </div>
                    )}
                    {offer.companyProfile.linkedinUrl && (
                      <div>
                        <span className="font-medium text-gray-600">LinkedIn:</span>
                        <a
                          href={offer.companyProfile.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-500 hover:text-blue-600 underline"
                        >
                          Ver perfil
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {offer.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Descripción</h3>
              <div className="text-gray-700 text-sm whitespace-pre-line">
                {offer.description.length > 1000 
                  ? offer.description.substring(0, 1000) + '...'
                  : offer.description
                }
              </div>
              {offer.description.length > 1000 && (
                <div className="mt-3">
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    Ver descripción completa
                  </a>
                </div>
              )}
            </div>
          )}

          {offer.companyProfile?.description && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Descripción de la Empresa</h3>
              <div className="text-gray-700 text-sm">
                {offer.companyProfile.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}