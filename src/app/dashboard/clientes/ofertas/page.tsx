'use client'

import React from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import JobOffersListPage from '@/components/JobOffers/JobOffersListPage'

export default function OfertasPage() {
  return (
    <DashboardLayout>
      <JobOffersListPage />
    </DashboardLayout>
  )
}