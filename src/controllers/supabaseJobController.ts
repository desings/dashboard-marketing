import { getSupabaseClient } from '@/lib/database'

export interface JobSearch {
  id: string
  user_id: string
  keywords: string
  portals: string[]
  frequency_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
  jobOffers?: JobOffer[]
  _count?: {
    jobOffers: number
  }
}

export interface JobOffer {
  id: string
  job_search_id: string
  title: string
  company: string | null
  location: string | null
  salary: string | null
  description: string | null
  url: string | null
  portal: string
  status: 'ACTIVE' | 'DISCARDED' | 'INTERESTED_DAVID' | 'INTERESTED_IVAN'
  external_id: string | null
  created_at: string
  updated_at: string
}

export class SupabaseJobController {
  private supabase = getSupabaseClient()

  // Obtener búsquedas de trabajo con paginación
  async getJobSearches(userId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit

    // Obtener total de búsquedas
    const { count: total } = await this.supabase
      .from('job_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Obtener búsquedas con conteo de ofertas
    const { data: searches, error } = await this.supabase
      .from('job_searches')
      .select(`
        *,
        job_offers(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Error fetching job searches: ${error.message}`)
    }

    // Transformar datos para coincidir con la interfaz esperada
    const transformedSearches = searches?.map(search => ({
      ...search,
      id: search.id,
      keywords: search.keywords,
      portals: search.portals,
      frequencyMinutes: search.frequency_minutes,
      isActive: search.is_active,
      createdAt: search.created_at,
      updatedAt: search.updated_at,
      _count: {
        jobOffers: search.job_offers?.length || 0
      }
    })) || []

    return {
      data: transformedSearches,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / limit),
      currentPage: page
    }
  }

  // Crear nueva búsqueda de trabajo
  async createJobSearch(data: {
    keywords: string
    userId: string
    frequencyMinutes: number
    portals: string[]
  }): Promise<JobSearch> {
    const { data: jobSearch, error } = await this.supabase
      .from('job_searches')
      .insert({
        user_id: data.userId,
        keywords: data.keywords,
        frequency_minutes: data.frequencyMinutes,
        portals: data.portals,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating job search: ${error.message}`)
    }

    console.log('✅ Búsqueda creada en Supabase:', jobSearch.id)

    // TODO: Iniciar scraping aquí
    // await this.startScraping(jobSearch.id)

    return jobSearch
  }

  // Obtener ofertas de trabajo con paginación mejorada
  async getJobOffers(
    userId: string,
    filters: {
      jobSearchId?: string
      status?: string
      page?: number
      limit?: number
      search?: string
    } = {}
  ) {
    const { page = 1, limit = 10 } = filters // Reducir a 10 por defecto
    const offset = (page - 1) * limit

    console.log(`📊 Obteniendo ofertas - Página: ${page}, Límite: ${limit}`)

    // Construir query base con join
    let query = this.supabase
      .from('job_offers')
      .select(`
        id,
        title,
        company,
        location,
        salary,
        description,
        url,
        portal,
        status,
        created_at,
        posted_at,
        external_id,
        job_search_id,
        job_searches!inner(user_id)
      `)
      .eq('job_searches.user_id', userId)
      .eq('status', 'ACTIVE') // Solo ofertas activas

    // Filtros opcionales
    if (filters.jobSearchId) {
      query = query.eq('job_search_id', filters.jobSearchId)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Obtener conteo total primero (sin paginación)
    const { count: total } = await this.supabase
      .from('job_offers')
      .select(`
        id,
        job_searches!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('job_searches.user_id', userId)
      .eq('status', 'ACTIVE')

    // Aplicar paginación y orden para obtener las más recientes
    const { data: offers, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Error fetching job offers: ${error.message}`)
    }

    const totalPages = Math.ceil((total || 0) / limit)

    console.log(`✅ Ofertas obtenidas: ${offers?.length || 0} de ${total || 0} total`)

    return {
      data: offers?.map(offer => ({
        id: offer.id,
        title: offer.title,
        company: offer.company,
        location: offer.location,
        salary: offer.salary,
        description: offer.description,
        url: offer.url,
        portal: offer.portal || 'infojobs',
        status: offer.status,
        publishedAt: offer.posted_at || offer.created_at,
        scrapedAt: offer.created_at,
        externalId: offer.external_id
      })) || [],
      total: total || 0,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit
    }
  }

  // Obtener estadísticas
  async getStats(userId: string) {
    // Búsquedas totales
    const { count: totalSearches } = await this.supabase
      .from('job_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Búsquedas activas
    const { count: activeSearches } = await this.supabase
      .from('job_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    // Total de ofertas
    const { count: totalOffers } = await this.supabase
      .from('job_offers')
      .select(`
        *,
        job_searches!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('job_searches.user_id', userId)

    // Ofertas de hoy
    const today = new Date().toISOString().split('T')[0]
    const { count: todayOffers } = await this.supabase
      .from('job_offers')
      .select(`
        *,
        job_searches!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('job_searches.user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)

    // Ofertas por estado
    const { data: statusCounts } = await this.supabase
      .from('job_offers')
      .select(`
        status,
        job_searches!inner(user_id)
      `)
      .eq('job_searches.user_id', userId)

    const offersByStatus = {
      ACTIVE: 0,
      DISCARDED: 0,
      INTERESTED_DAVID: 0,
      INTERESTED_IVAN: 0
    }

    statusCounts?.forEach(offer => {
      if (offer.status in offersByStatus) {
        offersByStatus[offer.status as keyof typeof offersByStatus]++
      }
    })

    return {
      totalSearches: totalSearches || 0,
      activeSearches: activeSearches || 0,
      totalOffers: totalOffers || 0,
      todayOffers: todayOffers || 0,
      offersByStatus
    }
  }

  // Scraping manual con InfoJobs REAL
  async manualScraping(jobSearchId: string): Promise<{
    success: boolean
    message: string
    newOffersCount?: number
    totalProcessed?: number
    errors?: string[]
  }> {
    try {
      // Obtener la búsqueda
      const { data: search, error: searchError } = await this.supabase
        .from('job_searches')
        .select('*')
        .eq('id', jobSearchId)
        .single()

      if (searchError || !search) {
        return {
          success: false,
          message: 'Búsqueda no encontrada'
        }
      }

      console.log(`🔍 Iniciando scraping REAL de InfoJobs para: "${search.keywords}"`)

      // Importar el scraper real
      const { InfoJobsScraperSupabase } = await import('@/services/infojobsScraperSupabase')
      const scraper = new InfoJobsScraperSupabase()

      // Realizar scraping real
      const scrapingResult = await scraper.scrapeJobOffers(
        search.keywords, 
        jobSearchId, 
        3, // máximo 3 páginas
        true // forceReal = true para scraping manual
      )

      // Actualizar última ejecución
      await this.supabase
        .from('job_searches')
        .update({
          last_execution: new Date().toISOString(),
          status: 'ACTIVE'
        })
        .eq('id', jobSearchId)

      return {
        success: true,
        message: `Scraping REAL completado: ${scrapingResult.newOffersCount} nuevas ofertas encontradas de ${scrapingResult.totalProcessed} procesadas`,
        newOffersCount: scrapingResult.newOffersCount,
        totalProcessed: scrapingResult.totalProcessed,
        errors: scrapingResult.errors.length > 0 ? scrapingResult.errors : undefined
      }

    } catch (error) {
      console.error('❌ Error en scraping REAL:', error)
      return {
        success: false,
        message: `Error durante el scraping REAL: ${error}`,
        errors: [String(error)]
      }
    }
  }

  // Actualizar búsqueda de trabajo
  async updateJobSearch(id: string, data: Partial<{
    keywords: string
    frequencyMinutes: number
    portals: string[]
    isActive: boolean
  }>): Promise<JobSearch> {
    const { data: jobSearch, error } = await this.supabase
      .from('job_searches')
      .update({
        ...(data.keywords && { keywords: data.keywords }),
        ...(data.frequencyMinutes && { frequency_minutes: data.frequencyMinutes }),
        ...(data.portals && { portals: data.portals }),
        ...(data.isActive !== undefined && { is_active: data.isActive }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating job search: ${error.message}`)
    }

    return jobSearch
  }

  // Eliminar búsqueda de trabajo
  async deleteJobSearch(id: string): Promise<void> {
    // Primero eliminar todas las ofertas asociadas
    const { error: offersError } = await this.supabase
      .from('job_offers')
      .delete()
      .eq('job_search_id', id)

    if (offersError) {
      throw new Error(`Error deleting job offers: ${offersError.message}`)
    }

    // Luego eliminar la búsqueda
    const { error } = await this.supabase
      .from('job_searches')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Error deleting job search: ${error.message}`)
    }
  }

  // Cambiar estado activo/inactivo de búsqueda
  async toggleJobSearchStatus(id: string): Promise<JobSearch> {
    // Primero obtener el estado actual
    const { data: currentSearch, error: fetchError } = await this.supabase
      .from('job_searches')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error(`Error fetching job search: ${fetchError.message}`)
    }

    // Cambiar el estado
    const newStatus = !currentSearch.is_active
    
    const { data: jobSearch, error } = await this.supabase
      .from('job_searches')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error toggling job search status: ${error.message}`)
    }

    return jobSearch
  }
}