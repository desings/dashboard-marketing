import * as cheerio from 'cheerio'
import { getSupabaseClient } from '@/lib/database'

export interface ScrapedJobOffer {
  title: string
  company: string | null
  location: string | null
  salary: string | null
  description: string | null
  url: string | null
  external_id: string | null
}

export class InfoJobsScraperSupabase {
  private supabase = getSupabaseClient()

  async scrapeJobOffers(keywords: string, jobSearchId: string, maxPages = 3): Promise<{
    newOffersCount: number
    totalProcessed: number
    errors: string[]
  }> {
    console.log(`🚀 Iniciando scraping de InfoJobs para: "${keywords}"`)
    
    let totalProcessed = 0
    let newOffersCount = 0
    const errors: string[] = []

    try {
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Scrapeando página ${page}/${maxPages}...`)
        
        try {
          const pageOffers = await this.scrapePage(keywords, page)
          console.log(`✅ Encontradas ${pageOffers.length} ofertas en página ${page}`)

          for (const offer of pageOffers) {
            try {
              const saved = await this.saveOffer(offer, jobSearchId)
              if (saved) {
                newOffersCount++
              }
              totalProcessed++
            } catch (saveError) {
              errors.push(`Error guardando oferta "${offer.title}": ${saveError}`)
              console.warn('⚠️ Error guardando oferta:', saveError)
            }
          }

          // Pequeña pausa entre páginas para no sobrecargar InfoJobs
          if (page < maxPages) {
            await this.delay(2000)
          }

        } catch (pageError) {
          errors.push(`Error en página ${page}: ${pageError}`)
          console.error(`❌ Error en página ${page}:`, pageError)
        }
      }

    } catch (generalError) {
      errors.push(`Error general de scraping: ${generalError}`)
      console.error('❌ Error general:', generalError)
    }

    console.log(`✅ Scraping completado: ${newOffersCount} nuevas ofertas de ${totalProcessed} procesadas`)

    return {
      newOffersCount,
      totalProcessed,
      errors
    }
  }

  private async scrapePage(keywords: string, page: number): Promise<ScrapedJobOffer[]> {
    // URL exacta proporcionada por el usuario
    const url = `https://www.infojobs.net/ofertas-trabajo?keyword=${encodeURIComponent(keywords)}&segmentId=&page=${page}&sortBy=RELEVANCE&onlyForeignCountry=false&countryIds=17&sinceDate=ANY`
    
    console.log(`🌐 Accediendo a: ${url}`)

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      return this.parseJobOffers(html)

    } catch (error) {
      console.error('❌ Error haciendo fetch:', error)
      throw new Error(`Error accediendo a InfoJobs: ${error}`)
    }
  }

  private parseJobOffers(html: string): ScrapedJobOffer[] {
    const $ = cheerio.load(html)
    const offers: ScrapedJobOffer[] = []

    console.log('🔍 Parseando ofertas de trabajo...')

    // Selectores para InfoJobs (pueden necesitar ajustes según la estructura actual)
    const jobSelectors = [
      '.offer-item', 
      '.job-item',
      '.js-offer-item',
      '[data-testid="offer-item"]',
      '.list-group-item'
    ]

    let jobElements: any = null

    // Probar diferentes selectores
    for (const selector of jobSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        jobElements = elements
        console.log(`✅ Usando selector: ${selector} (${elements.length} elementos)`)
        break
      }
    }

    if (!jobElements || jobElements.length === 0) {
      console.log('⚠️ No se encontraron ofertas con selectores conocidos, intentando estructura alternativa...')
      // Fallback: buscar enlaces que contengan '/ofertas-de-empleo/detail/'
      const links = $('a[href*="/ofertas-de-empleo/detail/"]')
      console.log(`🔗 Encontrados ${links.length} enlaces de ofertas`)

      links.each((_, element: any) => {
        const $link = $(element)
        const $container = $link.closest('div, li, article, section')
        
        const title = $link.text()?.trim() || 
                     $link.find('h1, h2, h3, h4, .title').text()?.trim() ||
                     'Título no disponible'
        
        const href = $link.attr('href')
        const fullUrl = href?.startsWith('http') ? href : `https://www.infojobs.net${href}`
        
        // Extraer ID de la URL
        const idMatch = href?.match(/detail\/(\w+)/)
        const externalId = idMatch ? idMatch[1] : null

        // Buscar información adicional en el contenedor
        const company = $container.find('.company, .employer, [data-testid="company"]').text()?.trim() || null
        const location = $container.find('.location, .city, [data-testid="location"]').text()?.trim() || null
        const salary = $container.find('.salary, .wage, [data-testid="salary"]').text()?.trim() || null

        if (title && title !== 'Título no disponible') {
          offers.push({
            title,
            company,
            location,
            salary,
            description: null, // Se puede obtener accediendo a la URL individual
            url: fullUrl,
            external_id: externalId
          })
        }
      })
    } else {
      // Procesar elementos encontrados con selectores
      jobElements.each((index: number, element: any) => {
        const $job = $(element)
        
        const titleSelectors = ['h1', 'h2', 'h3', '.title', '.offer-title', '[data-testid="title"]', 'a']
        let title = ''
        
        for (const selector of titleSelectors) {
          title = $job.find(selector).first().text()?.trim()
          if (title) break
        }
        
        const company = $job.find('.company, .employer, [data-testid="company"]').text()?.trim() || null
        const location = $job.find('.location, .city, [data-testid="location"]').text()?.trim() || null
        const salary = $job.find('.salary, .wage, [data-testid="salary"]').text()?.trim() || null
        
        // Buscar URL de la oferta
        const linkElement = $job.find('a[href*="/ofertas-de-empleo/detail/"]').first()
        const href = linkElement.attr('href')
        const fullUrl = href?.startsWith('http') ? href : `https://www.infojobs.net${href}`
        
        // Extraer ID
        const idMatch = href?.match(/detail\/(\w+)/)
        const externalId = idMatch ? idMatch[1] : null

        if (title) {
          offers.push({
            title,
            company,
            location,
            salary,
            description: null,
            url: fullUrl,
            external_id: externalId
          })
        }
      })
    }

    console.log(`📊 Parseadas ${offers.length} ofertas de trabajo`)
    return offers
  }

  private async saveOffer(offer: ScrapedJobOffer, jobSearchId: string): Promise<boolean> {
    try {
      const { data: existingOffer } = await this.supabase
        .from('job_offers')
        .select('id')
        .eq('external_id', offer.external_id)
        .eq('portal', 'infojobs')
        .single()

      if (existingOffer) {
        console.log(`⏭️ Oferta ya existe: ${offer.title}`)
        return false // Ya existe
      }

      const { error } = await this.supabase
        .from('job_offers')
        .insert({
          job_search_id: jobSearchId,
          title: offer.title,
          company: offer.company,
          location: offer.location,
          salary: offer.salary,
          description: offer.description,
          url: offer.url,
          portal: 'infojobs',
          status: 'ACTIVE',
          external_id: offer.external_id
        })

      if (error) {
        throw new Error(`Error insertando en Supabase: ${error.message}`)
      }

      console.log(`✅ Nueva oferta guardada: ${offer.title}`)
      return true

    } catch (error) {
      console.error('❌ Error guardando oferta:', error)
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}