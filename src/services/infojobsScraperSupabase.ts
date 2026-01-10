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
  publishDate?: string | null
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

    // Buscar enlaces de ofertas directamente
    const offerLinks = $('a[href*="/detail/"], a[href*="/empleo-"], a[href*=".aspx"]')
    
    console.log(`🔍 Encontrados ${offerLinks.length} enlaces de ofertas potenciales`)
    
    offerLinks.each((index, element) => {
      const $link = $(element)
      const href = $link.attr('href') || ''
      const titleText = $link.text()?.trim() || $link.attr('title')?.trim() || ''
      
      if (href && titleText && titleText.length > 5) {
        // Buscar datos en el elemento padre más cercano que contenga toda la oferta
        const $offer = $link.closest('article, div[data-testid], .offer, .result')
        
        // Extraer empresa - buscar múltiples selectores
        let companyText = ''
        
        // Buscar empresa en múltiples ubicaciones posibles
        const companySelectors = [
          '.company-name',
          '.company',
          '.offer-company',
          '[data-testid*="company"]',
          '.subtitle',
          'p:contains("empresa")',
          'span:contains("empresa")',
          'a[href*="/empresa/"]'
        ]
        
        for (const sel of companySelectors) {
          const companyEl = $offer.find(sel).first()
          if (companyEl.length > 0) {
            companyText = companyEl.text()?.trim()
            if (companyText && companyText.length > 1 && !companyText.toLowerCase().includes('infojobs')) {
              break
            }
          }
        }
        
        // Si no encuentra empresa, buscar en el contexto cercano al enlace
        if (!companyText) {
          const nearbyText = $link.parent().next('p, div, span').text()?.trim() || 
                           $link.parent().find('p, div, span').first().text()?.trim() || ''
          
          if (nearbyText && nearbyText.length < 100 && !nearbyText.toLowerCase().includes('madrid') && 
              !nearbyText.toLowerCase().includes('barcelona') && !nearbyText.toLowerCase().includes('€')) {
            companyText = nearbyText
          }
        }
        
        // Buscar ubicación
        let locationText = 'España'
        const locationSelectors = [
          '.location',
          '.offer-location',
          '[data-testid*="location"]',
          '.city',
          'span:contains("Madrid")',
          'span:contains("Barcelona")',
          'span:contains("Valencia")',
          'span:contains("Sevilla")'
        ]
        
        for (const sel of locationSelectors) {
          const locEl = $offer.find(sel).first()
          if (locEl.length > 0) {
            locationText = locEl.text()?.trim()
            if (locationText && locationText.length > 1) {
              break
            }
          }
        }
        
        // Buscar salario
        let salaryText = null
        const salarySelectors = [
          '.salary',
          '.offer-salary',
          '[data-testid*="salary"]',
          'span:contains("€")',
          'span:contains("salario")'
        ]
        
        for (const sel of salarySelectors) {
          const salEl = $offer.find(sel).first()
          if (salEl.length > 0) {
            salaryText = salEl.text()?.trim()
            if (salaryText && salaryText.length > 1) {
              break
            }
          }
        }
        
        // Buscar fecha de publicación
        let publishDate = null
        const dateSelectors = [
          '.date',
          '.publish-date',
          '[data-testid*="date"]',
          'span:contains("Hace")',
          'span:contains("día")',
          'span:contains("semana")',
          'time'
        ]
        
        for (const sel of dateSelectors) {
          const dateEl = $offer.find(sel).first()
          if (dateEl.length > 0) {
            publishDate = dateEl.text()?.trim() || dateEl.attr('datetime')
            if (publishDate && publishDate.length > 1) {
              break
            }
          }
        }
        
        // Corregir URL duplicada
        let fullUrl = href
        if (href.startsWith('//')) {
          fullUrl = `https:${href}`
        } else if (href.startsWith('/')) {
          fullUrl = `https://www.infojobs.net${href}`
        } else if (!href.startsWith('http')) {
          fullUrl = `https://www.infojobs.net/${href}`
        }
        
        // Limpiar URL duplicada si existe
        fullUrl = fullUrl.replace(/\/\/www\.infojobs\.net\/www\.infojobs\.net/g, '//www.infojobs.net')
        
        // Extraer ID real de InfoJobs
        const idMatch = href.match(/of-i([a-zA-Z0-9]+)/) || 
                       href.match(/\/([a-zA-Z0-9-]+)\.aspx/) || 
                       href.match(/detail\/([^\/\?]+)/) || 
                       href.match(/empleo-([^\/\?]+)/)
        const realId = idMatch ? idMatch[1] : `scraped-${Date.now()}-${index}`
        
        // Validar que es una oferta real
        if (titleText.length > 10 && href.includes('infojobs')) {
          offers.push({
            title: titleText.substring(0, 100),
            company: companyText.substring(0, 50) || 'Empresa no especificada',
            location: locationText.substring(0, 50) || 'España',
            salary: salaryText?.substring(0, 50) || null,
            description: `Oferta real extraída de InfoJobs: ${titleText}`,
            url: fullUrl,
            external_id: realId,
            publishDate: publishDate || null
          })
          
          console.log(`  ✅ EXTRAÍDO: "${titleText}"`) 
          console.log(`     🏢 Empresa: "${companyText || 'No especificada'}"`)
          console.log(`     📍 Ubicación: "${locationText}"`)
          console.log(`     📅 Fecha: "${publishDate || 'No disponible'}"`)
          console.log(`     🔗 URL: ${fullUrl}`)
        }
      }
    })

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
          external_id: offer.external_id,
          posted_at: offer.publishDate || new Date().toISOString()
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