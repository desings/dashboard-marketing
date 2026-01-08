'use client'

import React from 'react'
import JobSearchListPage from '@/components/JobSearch/JobSearchListPage'

export default function BusquedaClientesPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <JobSearchListPage />
      </div>
    </div>
  )
}