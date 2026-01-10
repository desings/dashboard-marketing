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

  // Método que realiza scraping real usando Puppeteer
  private async performRealScraping(keywords: string, page: number): Promise<ScrapedJobOffer[]> {
    console.log(`🌐 INICIANDO SCRAPING REAL DE INFOJOBS para: "${keywords}" página ${page}`)
    
    // ===== MÉTODO 1: USAR API DE INFOJOBS DIRECTAMENTE =====
    try {
      const response = await fetch(`https://api.infojobs.net/api/9/offer?q=${encodeURIComponent(keywords)}&page=${page}&maxResults=50`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(process.env.INFOJOBS_CLIENT_ID + ':' + process.env.INFOJOBS_CLIENT_SECRET).toString('base64'),
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ InfoJobs API: ${data.offers?.length || 0} ofertas encontradas`)
        
        if (data.offers && data.offers.length > 0) {
          return data.offers.map((offer: any) => ({
            title: offer.title || 'Oferta sin título',
            company: offer.author?.name || 'Empresa no especificada',
            location: offer.province?.value || offer.city || 'Ubicación no especificada',
            salary: offer.salaryDescription || null,
            description: offer.description || offer.title,
            url: offer.link || `https://www.infojobs.net/oferta/${offer.id}`,
            external_id: offer.id || `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }))
        }
      }
    } catch (apiError) {
      console.warn('⚠️ InfoJobs API falló, usando scraping directo:', apiError)
    }

    // ===== MÉTODO 2: SCRAPING DIRECTO CON PUPPETEER =====
    const puppeteer = await import('puppeteer')
    let browser: any = null

    try {
      browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      })

      const browserPage = await browser.newPage()
      
      await browserPage.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // URL de búsqueda directa de InfoJobs
      const searchUrl = `https://www.infojobs.net/ofertas-trabajo/${encodeURIComponent(keywords.toLowerCase().replace(/\s+/g, '-'))}.aspx?p=${page}`
      console.log(`🔍 Navegando a InfoJobs: ${searchUrl}`)
      
      await browserPage.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 })
      await browserPage.waitForTimeout(5000)
      
      // Extraer ofertas directamente del DOM
      const offers = await browserPage.evaluate(() => {
        const results: any[] = []
        
        // Buscar elementos de ofertas en InfoJobs
        const offerElements = document.querySelectorAll('article, .offer-item, [data-testid*="offer"], .list-offer')
        
        offerElements.forEach((element: any, index: number) => {
          try {
            const titleEl = element.querySelector('h2, h3, .offer-title, [data-testid="offer-title"], a[title]')
            const companyEl = element.querySelector('.company, .company-name, [data-testid="company-name"]')
            const locationEl = element.querySelector('.location, .offer-location, [data-testid="offer-location"]')
            const salaryEl = element.querySelector('.salary, .offer-salary, [data-testid="salary"]')
            const linkEl = element.querySelector('a[href*="/detail/"], a[href*="/oferta/"], a[href*="infojobs.net"]')
            
            if (titleEl) {
              const title = titleEl.textContent?.trim() || titleEl.title || `Oferta ${index + 1}`
              const company = companyEl?.textContent?.trim() || 'Empresa'
              const location = locationEl?.textContent?.trim() || 'España'
              const salary = salaryEl?.textContent?.trim() || null
              const url = linkEl?.href || `https://www.infojobs.net/oferta-${index}`
              
              results.push({
                title: title.substring(0, 100),
                company: company.substring(0, 50),
                location: location.substring(0, 50), 
                salary: salary?.substring(0, 30) || null,
                description: `Oferta de empleo para ${title}`,
                url: url.includes('infojobs.net') ? url : `https://www.infojobs.net${url}`,
                external_id: `scraped-${Date.now()}-${index}`
              })
            }
          } catch (err) {
            console.warn('Error procesando elemento:', err)
          }
        })
        
        return results
      })

      console.log(`📋 Ofertas extraídas de InfoJobs: ${offers.length}`)
      
      if (offers.length > 0) {
        return offers
      }

      // Si no encontró ofertas, hacer scraping alternativo
      const html = await browserPage.content()
      return this.extractOffersFromHTML(html, keywords)

    } catch (error) {
      console.error('❌ Error en scraping real:', error)
      throw new Error(`No se pudieron obtener ofertas reales de InfoJobs: ${error}`)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  // Método directo para extraer ofertas del HTML de InfoJobs
  private extractOffersFromHTML(html: string, keywords: string): ScrapedJobOffer[] {
    const $ = cheerio.load(html)
    const offers: ScrapedJobOffer[] = []

    console.log('🔍 Extrayendo ofertas directamente del HTML de InfoJobs...')

    // Buscar ofertas usando múltiples selectores
    const offerSelectors = [
      'article',
      '.offer-item',
      '[data-testid*="offer"]',
      '.js-offer-link',
      '.offer-element'
    ]

    for (const selector of offerSelectors) {
      const elements = $(selector)
      console.log(`📋 Selector "${selector}": ${elements.length} elementos`)

      elements.each((index, element) => {
        const $element = $(element)
        
        const titleEl = $element.find('h2, h3, .offer-title, [data-testid="offer-title"], a[title]').first()
        const companyEl = $element.find('.company-name, .company, [data-testid="company-name"]').first()  
        const locationEl = $element.find('.offer-location, .location, [data-testid="offer-location"]').first()
        const linkEl = $element.find('a[href*="/detail/"], a[href*="/oferta/"]').first()

        const title = titleEl.text()?.trim() || titleEl.attr('title') || ''
        const company = companyEl.text()?.trim() || 'Empresa'
        const location = locationEl.text()?.trim() || 'España'
        const link = linkEl.attr('href') || ''

        if (title && title.length > 5) {
          const fullUrl = link.startsWith('http') ? link : `https://www.infojobs.net${link}`
          
          offers.push({
            title: title.substring(0, 100),
            company: company.substring(0, 50),
            location: location.substring(0, 50),
            salary: null,
            description: `Oferta de empleo: ${title}`,
            url: fullUrl,
            external_id: `scraped-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`
          })
        }
      })

      if (offers.length > 0) break // Si encontró ofertas, no seguir buscando
    }

    // Si aún no encontró ofertas, buscar enlaces directos
    if (offers.length === 0) {
      console.log('🔍 No se encontraron ofertas, buscando enlaces directos...')
      
      const links = $('a[href*="infojobs.net"], a[href*="/detail/"], a[href*="/oferta/"]')
      links.each((index, element) => {
        const $link = $(element)
        const title = $link.text()?.trim() || $link.attr('title') || `Oferta ${index + 1}`
        const href = $link.attr('href') || ''
        
        if (title.length > 5 && href) {
          const fullUrl = href.startsWith('http') ? href : `https://www.infojobs.net${href}`
          
          offers.push({
            title: title.substring(0, 100),
            company: 'InfoJobs',
            location: 'España',
            salary: null,
            description: `Oferta encontrada: ${title}`,
            url: fullUrl,
            external_id: `link-${Date.now()}-${index}`
          })
        }
      })
    }

    console.log(`✅ Extraídas ${offers.length} ofertas reales del HTML`)
    
    // Si aún no hay ofertas, es porque InfoJobs cambió su estructura
    if (offers.length === 0) {
      throw new Error('No se pudieron extraer ofertas de InfoJobs - posible cambio en estructura web')
    }

    return offers
  }

  private parseJobOffersWithDebug(html: string): ScrapedJobOffer[] {
    console.log('🔍 Usando método directo de extracción...')
    return this.extractOffersFromHTML(html, 'búsqueda')
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