'use client'

import React from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import JobSearchListPage from '@/components/JobSearch/JobSearchListPage'

export default function BusquedaClientesPage() {
  return (
    <DashboardLayout>
      <JobSearchListPage />
    </DashboardLayout>
  )
}