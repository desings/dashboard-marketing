'use client'

import React from 'react'
import JobOffersListPage from '@/components/JobOffers/JobOffersListPage'

export default function OfertasPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <JobOffersListPage />
      </div>
    </div>
  )
}