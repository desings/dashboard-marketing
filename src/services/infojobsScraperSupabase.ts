import * as cheerio from 'cheerio'
import puppeteer, { Browser, Page } from 'puppeteer'
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
    
    console.log(`🌐 Accediendo con Puppeteer a: ${url}`)

    let browser: Browser | null = null
    
    try {
      // Lanzar navegador con configuración optimizada
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      })

      const page: Page = await browser.newPage()
      
      // Configurar user agent y viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      await page.setViewport({ width: 1920, height: 1080 })

      console.log(`📱 Navegando a InfoJobs...`)
      
      // Navegar con timeout extendido
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      })

      console.log(`⏳ Esperando a que carguen las ofertas...`)

      // Esperar a que aparezcan las ofertas (múltiples selectores)
      try {
        await page.waitForSelector('[data-testid="offer-item"], .offer-item, .js-offer-item, [data-cy="OfferItem"], .list-offers article', {
          timeout: 15000
        })
        console.log(`✅ Ofertas cargadas correctamente`)
      } catch (waitError) {
        console.log(`⚠️ Timeout esperando ofertas, continuando con el HTML disponible...`)
      }

      // Esperar un poco más para asegurar que todo el contenido dinámico se ha cargado
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Obtener el HTML renderizado
      const html = await page.content()
      console.log(`📄 HTML obtenido, tamaño: ${html.length} caracteres`)

      return this.parseJobOffers(html)

    } catch (error) {
      console.error('❌ Error usando Puppeteer:', error)
      throw new Error(`Error scrapeando con Puppeteer: ${error}`)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  private parseJobOffers(html: string): ScrapedJobOffer[] {
    const $ = cheerio.load(html)
    const offers: ScrapedJobOffer[] = []

    console.log('🔍 Parseando ofertas de trabajo...')

    // Selectores actualizados para InfoJobs 2024/2025
    const jobSelectors = [
      '[data-testid="offer-item"]',
      '[data-cy="OfferItem"]', 
      '.list-offers article',
      '.offer-item', 
      '.js-offer-item',
      'article[data-adid]',
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
      
      // Fallback mejorado: buscar múltiples patrones de enlaces
      const linkPatterns = [
        'a[href*="/ofertas-trabajo/"]',
        'a[href*="/ofertas-de-empleo/detail/"]', 
        'a[href*="/empleo/"]',
        'a[href*="infojobs.net"][href*="detail"]'
      ]

      for (const pattern of linkPatterns) {
        const links = $(pattern)
        if (links.length > 0) {
          console.log(`🔗 Encontrados ${links.length} enlaces con patrón: ${pattern}`)
          
          links.each((_, element: any) => {
            const $link = $(element)
            const $container = $link.closest('div, li, article, section')
            
            const title = $link.text()?.trim() || 
                         $link.find('h1, h2, h3, h4, .title, [data-testid="title"]').text()?.trim() ||
                         $container.find('h1, h2, h3, h4').first().text()?.trim() ||
                         'Título no disponible'
            
            const href = $link.attr('href')
            if (!href) return
            
            const fullUrl = href.startsWith('http') ? href : `https://www.infojobs.net${href}`
            
            // Extraer ID de diferentes formatos de URL de InfoJobs
            const idMatches = [
              href.match(/\/detail\/(\w+)/),
              href.match(/\/(\w+)\.html/),
              href.match(/oferta-(\w+)/),
              href.match(/\/([a-zA-Z0-9]{8,})/),
            ]
            
            const externalId = idMatches.find(match => match)?.[1] || null

            const company = $container.find('[data-testid="company"], .company, .employer').text()?.trim() || 
                           $container.find('span, p').filter((_, el) => {
                             const text = $(el).text()
                             return text.includes('S.L.') || text.includes('S.A.') || text.includes('Ltd')
                           }).first().text()?.trim() ||
                           null
                           
            const location = $container.find('[data-testid="location"], .location, .city').text()?.trim() ||
                            $container.find('span, p').filter((_, el) => {
                              const text = $(el).text()
                              return text.includes('Madrid') || text.includes('Barcelona') || text.includes('Valencia') || text.includes('Sevilla') || text.includes(',')
                            }).first().text()?.trim() ||
                            null
                            
            const salary = $container.find('[data-testid="salary"], .salary, .wage').text()?.trim() ||
                          $container.find('span, p').filter((_, el) => {
                            const text = $(el).text()
                            return text.includes('€') || text.includes('euros') || Boolean(text.match(/\d+\.?\d*/))
                          }).first().text()?.trim() ||
                          null

            if (title && title !== 'Título no disponible' && title.length > 5) {
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
          
          if (offers.length > 0) break // Si encontramos ofertas, no seguimos buscando
        }
      }
    } else {
      // Procesar elementos encontrados con selectores principales
      jobElements.each((index: number, element: any) => {
        const $job = $(element)
        
        // Selectores múltiples para título
        const titleSelectors = [
          '[data-testid="title"]',
          'h1, h2, h3, h4',
          '.title, .offer-title', 
          'a[href*="detail"] h3',
          'a[href*="detail"]'
        ]
        
        let title = ''
        for (const selector of titleSelectors) {
          const titleText = $job.find(selector).first().text()?.trim()
          if (titleText && titleText.length > 3) {
            title = titleText
            break
          }
        }
        
        // Si no encontramos título, usar el texto del enlace principal
        if (!title) {
          const mainLink = $job.find('a[href*="detail"], a[href*="empleo"]').first()
          title = mainLink.text()?.trim() || 'Sin título'
        }
        
        const company = $job.find('[data-testid="company"], .company, .employer').text()?.trim() || null
        const location = $job.find('[data-testid="location"], .location, .city').text()?.trim() || null  
        const salary = $job.find('[data-testid="salary"], .salary, .wage').text()?.trim() || null
        
        // Buscar URL de la oferta
        const linkElement = $job.find('a[href*="detail"], a[href*="empleo"]').first()
        const href = linkElement.attr('href')
        const fullUrl = href?.startsWith('http') ? href : `https://www.infojobs.net${href}`
        
        // Extraer ID
        const idMatch = href?.match(/detail\/(\w+)/) || href?.match(/\/([a-zA-Z0-9]{8,})/)
        const externalId = idMatch?.[1] || null

        if (title && title.length > 3) {
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
    
    // Debug: mostrar las primeras 2 ofertas encontradas
    if (offers.length > 0) {
      console.log('🔍 Primeras ofertas encontradas:')
      offers.slice(0, 2).forEach((offer, index) => {
        console.log(`  ${index + 1}. ${offer.title} - ${offer.company} (${offer.location})`)
      })
    } else {
      console.log('⚠️ No se encontraron ofertas - verificando HTML...')
      const bodyText = $('body').text()
      if (bodyText.includes('No se han encontrado') || bodyText.includes('0 ofertas')) {
        console.log('💡 InfoJobs indica que no hay ofertas para esta búsqueda')
      } else if (bodyText.includes('ofertas')) {
        console.log('💡 El HTML contiene la palabra "ofertas" pero no pudimos extraerlas')
        // Guardar una muestra del HTML para debug
        console.log('📄 Muestra del HTML:', $('body').html()?.substring(0, 500))
      }
    }
    
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