import * as cheerio from 'cheerio'
import { Browser, Page } from 'puppeteer'
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

  async scrapeJobOffers(keywords: string, jobSearchId: string, maxPages = 3, forceReal = false): Promise<{
    newOffersCount: number
    totalProcessed: number
    errors: string[]
  }> {
    console.log(`🚀 Iniciando scraping de InfoJobs para: "${keywords}" (forceReal: ${forceReal})`)
    
    let totalProcessed = 0
    let newOffersCount = 0
    const errors: string[] = []

    try {
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Scrapeando página ${page}/${maxPages}...`)
        
        try {
          const pageOffers = await this.scrapePage(keywords, page, forceReal)
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

  private async scrapePage(keywords: string, page: number, forceReal: boolean = false): Promise<ScrapedJobOffer[]> {
    // ✅ SCRAPER REAL ACTIVADO: Siempre usar datos reales de InfoJobs
    // El sistema ahora está configurado para obtener ofertas reales
    console.log(`🔍 SCRAPING REAL de InfoJobs para "${keywords}" página ${page}`)
    
    // Vamos a usar SIEMPRE el scraper real
    return this.performRealScraping(keywords, page)
  }

  // Método que realiza scraping real usando HTTP directo
  private async performRealScraping(keywords: string, page: number): Promise<ScrapedJobOffer[]> {
    console.log(`🌐 SCRAPING REAL HTTP de InfoJobs: "${keywords}" página ${page}`)
    
    // ===== SOLO SCRAPING HTTP REAL - SIN SIMULACIONES =====
    const searchUrl = `https://www.infojobs.net/ofertas-trabajo?keyword=${encodeURIComponent(keywords)}&page=${page}`
    console.log(`🔍 Fetch directo a InfoJobs: ${searchUrl}`)
    
    try {
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none'
        }
      })

      if (!response.ok) {
        throw new Error(`InfoJobs HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      console.log(`📄 HTML descargado de InfoJobs: ${html.length} caracteres`)
      
      // Verificar que contiene ofertas de trabajo
      if (!html.includes('oferta') && !html.includes('empleo') && !html.includes('trabajo')) {
        throw new Error('HTML de InfoJobs no contiene ofertas de trabajo')
      }
      
      // Extraer ofertas reales del HTML
      const offers = this.extractRealOffersFromHTML(html, keywords)
      
      if (offers.length === 0) {
        throw new Error(`No se encontraron ofertas reales en InfoJobs para "${keywords}"`)
      }
      
      console.log(`✅ SCRAPING REAL EXITOSO: ${offers.length} ofertas reales extraídas`)
      return offers
      
    } catch (error) {
      console.error('❌ SCRAPING REAL FALLÓ:', error)
      throw new Error(`FALLO SCRAPING REAL InfoJobs: ${error}`)
    }
  }

  // Método REAL para extraer ofertas del HTML de InfoJobs
  private extractRealOffersFromHTML(html: string, keywords: string): ScrapedJobOffer[] {
    const $ = cheerio.load(html)
    const offers: ScrapedJobOffer[] = []

    console.log('🔍 EXTRAYENDO OFERTAS REALES de InfoJobs HTML...')

    // Buscar ofertas usando selectores de InfoJobs específicos
    const possibleSelectors = [
      'article.offer',
      'div[data-testid*="offer"]',
      '.offer-item',
      '.js-offer-link',
      'article',
      '[data-offer-id]',
      '.list-offer-element'
    ]

    let foundOffers = false
    
    for (const selector of possibleSelectors) {
      const elements = $(selector)
      console.log(`🔍 Selector "${selector}": ${elements.length} elementos`)

      if (elements.length > 0) {
        elements.each((index, element) => {
          const $element = $(element)
          
          // Buscar título de la oferta
          const titleEl = $element.find('h2 a, h3 a, .offer-title a, a[title]').first()
          const titleText = titleEl.text()?.trim() || titleEl.attr('title')?.trim() || ''
          
          // Buscar enlace de la oferta
          const linkEl = $element.find('a[href*="/detail/"], a[href*="/empleo-"], a[href*="/oferta"]').first()
          const href = linkEl.attr('href') || ''
          
          // Buscar empresa
          const companyEl = $element.find('.company-name, .company, .offer-company').first()
          const companyText = companyEl.text()?.trim() || ''
          
          // Buscar ubicación
          const locationEl = $element.find('.offer-location, .location, [data-testid*="location"]').first()
          const locationText = locationEl.text()?.trim() || ''
          
          // Buscar salario
          const salaryEl = $element.find('.offer-salary, .salary, [data-testid*="salary"]').first()
          const salaryText = salaryEl.text()?.trim() || null
          
          // Validar que es una oferta real
          if (titleText && titleText.length > 5 && href && href.includes('infojobs')) {
            const fullUrl = href.startsWith('http') ? href : `https://www.infojobs.net${href}`
            
            // Extraer ID real de InfoJobs del href
            const idMatch = href.match(/\/([a-zA-Z0-9-]+)\.aspx/) || href.match(/detail\/([^\/\?]+)/) || href.match(/empleo-([^\/\?]+)/)
            const realId = idMatch ? idMatch[1] : `scraped-${Date.now()}-${index}`
            
            offers.push({
              title: titleText.substring(0, 100),
              company: companyText.substring(0, 50) || 'Empresa InfoJobs',
              location: locationText.substring(0, 50) || 'España',
              salary: salaryText?.substring(0, 30) || null,
              description: `Oferta real extraída de InfoJobs: ${titleText}`,
              url: fullUrl,
              external_id: realId
            })
            
            console.log(`  ✅ REAL: "${titleText}" - ${companyText} - ${fullUrl}`)
            foundOffers = true
          }
        })
        
        if (foundOffers && offers.length > 0) {
          break // Si encontramos ofertas con este selector, parar
        }
      }
    }

    // Si no encontró ofertas con selectores, buscar enlaces directos
    if (offers.length === 0) {
      console.log('🔍 Buscando enlaces directos de ofertas...')
      
      const links = $('a[href*="infojobs.net"], a[href*="/detail/"], a[href*="/empleo"]')
      
      links.each((index, element) => {
        const $link = $(element)
        const href = $link.attr('href') || ''
        const text = $link.text()?.trim() || ''
        
        if (href && text && text.length > 10 && text.length < 200) {
          // Verificar que parece una oferta de trabajo
          const lowerText = text.toLowerCase()
          if (lowerText.includes('desarrollador') || 
              lowerText.includes('programador') ||
              lowerText.includes('ingeniero') ||
              lowerText.includes('analista') ||
              lowerText.includes('técnico') ||
              lowerText.includes(keywords.toLowerCase())) {
            
            const fullUrl = href.startsWith('http') ? href : `https://www.infojobs.net${href}`
            const linkId = href.match(/\/([a-zA-Z0-9-]+)/) ? href.match(/\/([a-zA-Z0-9-]+)/)![1] : `link-${index}`
            
            offers.push({
              title: text.substring(0, 100),
              company: 'Empresa InfoJobs',
              location: 'España',
              salary: null,
              description: `Oferta real encontrada: ${text}`,
              url: fullUrl,
              external_id: linkId
            })
            
            console.log(`  ✅ ENLACE REAL: "${text}" - ${fullUrl}`)
          }
        }
      })
    }

    console.log(`📊 OFERTAS REALES EXTRAÍDAS: ${offers.length}`)
    
    if (offers.length === 0) {
      // Mostrar debug del HTML para análisis
      console.log('❌ NO SE ENCONTRARON OFERTAS REALES')
      console.log('📄 Muestra HTML (primeros 1000 chars):')
      console.log(html.substring(0, 1000))
      
      // Verificar qué enlaces hay en la página
      const allLinks = $('a[href]')
      console.log(`🔗 Total enlaces en página: ${allLinks.length}`)
      allLinks.slice(0, 10).each((i, el) => {
        const href = $(el).attr('href')
        const text = $(el).text().trim().substring(0, 50)
        console.log(`  Link ${i + 1}: "${text}" -> ${href}`)
      })
    }

    return offers
  }

  // Método directo para extraer ofertas del HTML de InfoJobs
  private extractOffersFromHTML(html: string, keywords: string): ScrapedJobOffer[] {
    return this.extractRealOffersFromHTML(html, keywords)
  }

  private parseJobOffersWithDebug(html: string): ScrapedJobOffer[] {
    console.log('🔍 Parseando ofertas REALES de InfoJobs...')
    return this.extractRealOffersFromHTML(html, 'búsqueda')
  }

  // Mantener función original como fallback
  private parseJobOffers(html: string): ScrapedJobOffer[] {
    return this.parseJobOffersWithDebug(html)
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
          // posted_at removido - columna no existe en Supabase
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