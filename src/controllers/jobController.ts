import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, JobStatus } from '@prisma/client'
import { scrapeInfoJobs, saveJobOffers } from '@/services/scraper'
import { autoEnrichOnInterest } from '@/services/enrichment'

const prisma = new PrismaClient()

export interface JobSearchRequest {
  keywords: string
  portals?: string[]
  frequencyMinutes?: number
  userId: string
}

export interface UpdateJobOfferStatusRequest {
  status: JobStatus
}

export class JobController {
  
  // ===== JOB SEARCHES =====
  
  static async createJobSearch(request: JobSearchRequest) {
    try {
      console.log('📝 Creando nueva búsqueda de trabajo:', request)
      
      const jobSearch = await prisma.jobSearch.create({
        data: {
          userId: request.userId,
          keywords: request.keywords,
          portals: request.portals || ['infojobs'],
          frequencyMinutes: request.frequencyMinutes || 360,
          isActive: true
        }
      })

      console.log(`✅ Búsqueda creada: ${jobSearch.id}`)
      
      // Ejecutar scraping inicial
      await JobController.executeJobSearch(jobSearch.id)
      
      return jobSearch

    } catch (error) {
      console.error('❌ Error creando búsqueda:', error)
      throw new Error(`Error creando búsqueda: ${error}`)
    }
  }

  static async getJobSearches(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit
      
      const [jobSearches, total] = await Promise.all([
        prisma.jobSearch.findMany({
          where: { userId },
          include: {
            _count: {
              select: { jobOffers: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.jobSearch.count({ where: { userId } })
      ])

      return {
        data: jobSearches,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      console.error('❌ Error obteniendo búsquedas:', error)
      throw new Error(`Error obteniendo búsquedas: ${error}`)
    }
  }

  static async updateJobSearch(id: string, data: Partial<JobSearchRequest>) {
    try {
      const jobSearch = await prisma.jobSearch.update({
        where: { id },
        data: {
          keywords: data.keywords,
          portals: data.portals,
          frequencyMinutes: data.frequencyMinutes,
          updatedAt: new Date()
        }
      })

      console.log(`✅ Búsqueda actualizada: ${id}`)
      return jobSearch

    } catch (error) {
      console.error('❌ Error actualizando búsqueda:', error)
      throw new Error(`Error actualizando búsqueda: ${error}`)
    }
  }

  static async deleteJobSearch(id: string) {
    try {
      await prisma.jobSearch.delete({
        where: { id }
      })

      console.log(`🗑️ Búsqueda eliminada: ${id}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error eliminando búsqueda:', error)
      throw new Error(`Error eliminando búsqueda: ${error}`)
    }
  }

  static async toggleJobSearchStatus(id: string) {
    try {
      const jobSearch = await prisma.jobSearch.findUnique({
        where: { id }
      })

      if (!jobSearch) {
        throw new Error('Búsqueda no encontrada')
      }

      const updated = await prisma.jobSearch.update({
        where: { id },
        data: {
          isActive: !jobSearch.isActive,
          updatedAt: new Date()
        }
      })

      console.log(`🔄 Estado de búsqueda cambiado: ${id} -> ${updated.isActive ? 'activa' : 'inactiva'}`)
      return updated

    } catch (error) {
      console.error('❌ Error cambiando estado:', error)
      throw new Error(`Error cambiando estado: ${error}`)
    }
  }

  // ===== JOB OFFERS =====

  static async getJobOffers(
    filters: {
      status?: JobStatus
      jobSearchId?: string
      userId?: string
    },
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const skip = (page - 1) * limit
      const where: any = {}

      if (filters.status) {
        where.status = filters.status
      }

      if (filters.jobSearchId) {
        where.jobSearchId = filters.jobSearchId
      }

      if (filters.userId) {
        where.jobSearch = { userId: filters.userId }
      }

      const [jobOffers, total] = await Promise.all([
        prisma.jobOffer.findMany({
          where,
          include: {
            jobSearch: {
              select: { keywords: true, userId: true }
            },
            companyProfile: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.jobOffer.count({ where })
      ])

      return {
        data: jobOffers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      console.error('❌ Error obteniendo ofertas:', error)
      throw new Error(`Error obteniendo ofertas: ${error}`)
    }
  }

  static async getJobOfferById(id: string) {
    try {
      const jobOffer = await prisma.jobOffer.findUnique({
        where: { id },
        include: {
          jobSearch: true,
          companyProfile: true
        }
      })

      if (!jobOffer) {
        throw new Error('Oferta no encontrada')
      }

      return jobOffer

    } catch (error) {
      console.error('❌ Error obteniendo oferta:', error)
      throw new Error(`Error obteniendo oferta: ${error}`)
    }
  }

  static async updateJobOfferStatus(id: string, status: JobStatus) {
    try {
      console.log(`🔄 Actualizando estado de oferta ${id} a ${status}`)

      const jobOffer = await prisma.jobOffer.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date()
        }
      })

      // Auto-enriquecer si se marca como interesante
      if (status === 'INTERESTED_DAVID' || status === 'INTERESTED_IVAN') {
        console.log(`🔍 Iniciando enriquecimiento automático para oferta: ${id}`)
        autoEnrichOnInterest(id).catch(error => {
          console.error('❌ Error en enriquecimiento automático:', error)
        })
      }

      console.log(`✅ Estado actualizado: ${status}`)
      return jobOffer

    } catch (error) {
      console.error('❌ Error actualizando estado:', error)
      throw new Error(`Error actualizando estado: ${error}`)
    }
  }

  static async deleteJobOffer(id: string) {
    try {
      await prisma.jobOffer.delete({
        where: { id }
      })

      console.log(`🗑️ Oferta eliminada: ${id}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error eliminando oferta:', error)
      throw new Error(`Error eliminando oferta: ${error}`)
    }
  }

  // ===== SCRAPING =====

  static async executeJobSearch(jobSearchId: string) {
    try {
      console.log(`🔄 Ejecutando scraping para búsqueda: ${jobSearchId}`)

      const jobSearch = await prisma.jobSearch.findUnique({
        where: { id: jobSearchId }
      })

      if (!jobSearch || !jobSearch.isActive) {
        console.log('⏭️ Búsqueda no encontrada o inactiva')
        return { skipped: true }
      }

      let totalNewOffers = 0

      // Iterar por cada portal configurado
      for (const portal of jobSearch.portals) {
        if (portal === 'infojobs') {
          console.log(`🔍 Scraping InfoJobs para: "${jobSearch.keywords}"`)
          
          try {
            const offers = await scrapeInfoJobs(jobSearch.keywords)
            const savedCount = await saveJobOffers(jobSearchId, offers)
            totalNewOffers += savedCount
            
            console.log(`✅ InfoJobs: ${savedCount} nuevas ofertas`)
          } catch (error) {
            console.error(`❌ Error scraping InfoJobs:`, error)
          }
        }
      }

      // Actualizar timestamp de última ejecución
      await prisma.jobSearch.update({
        where: { id: jobSearchId },
        data: { updatedAt: new Date() }
      })

      console.log(`🎯 Scraping completado: ${totalNewOffers} nuevas ofertas`)
      
      return {
        success: true,
        newOffersCount: totalNewOffers,
        keywords: jobSearch.keywords,
        portals: jobSearch.portals
      }

    } catch (error) {
      console.error('❌ Error ejecutando scraping:', error)
      throw new Error(`Error ejecutando scraping: ${error}`)
    }
  }

  static async manualScraping(jobSearchId: string) {
    try {
      console.log(`🚀 Scraping manual iniciado para: ${jobSearchId}`)
      return await JobController.executeJobSearch(jobSearchId)
    } catch (error) {
      console.error('❌ Error en scraping manual:', error)
      throw error
    }
  }

  // ===== ESTADÍSTICAS =====

  static async getJobSearchStats(userId: string) {
    try {
      const stats = await prisma.$transaction([
        // Total de búsquedas
        prisma.jobSearch.count({
          where: { userId }
        }),
        
        // Búsquedas activas
        prisma.jobSearch.count({
          where: { userId, isActive: true }
        }),
        
        // Total de ofertas
        prisma.jobOffer.count({
          where: { jobSearch: { userId } }
        }),
        
        // Ofertas por estado
        prisma.jobOffer.groupBy({
          by: ['status'],
          where: { jobSearch: { userId } },
          _count: true
        }),
        
        // Ofertas de hoy
        prisma.jobOffer.count({
          where: {
            jobSearch: { userId },
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ])

      const [totalSearches, activeSearches, totalOffers, offersByStatus, todayOffers] = stats

      return {
        totalSearches,
        activeSearches,
        totalOffers,
        todayOffers,
        offersByStatus: offersByStatus.reduce((acc, item) => {
          acc[item.status] = item._count
          return acc
        }, {} as Record<string, number>)
      }

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw new Error(`Error obteniendo estadísticas: ${error}`)
    }
  }
}