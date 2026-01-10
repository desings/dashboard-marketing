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

  async scrapeJobOffers(keywords: string, jobSearchId: string, maxPages = 1, forceReal = false): Promise<{
    newOffersCount: number
    totalProcessed: number
    errors: string[]
  }> {
    console.log(`🚀 Iniciando scraping de InfoJobs para: "${keywords}" (limitado a 1 página para obtener las 10 más recientes)`)
    
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
    
    // Delay aleatorio para evitar detección
    const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 segundos
    console.log(`⏱️ Esperando ${delay}ms para evitar detección...`)
    await this.delay(delay)
    
    // Intentar múltiples URLs de InfoJobs
    const urls = [
      `https://www.infojobs.net/ofertas-trabajo?keyword=${encodeURIComponent(keywords)}&page=${page}`,
      `https://www.infojobs.net/empleo/${encodeURIComponent(keywords)}?page=${page}`,
      `https://www.infojobs.net/ofertas-trabajo/${encodeURIComponent(keywords)}?page=${page}`
    ]
    
    let lastError: Error | null = null
    
    for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
      const searchUrl = urls[urlIndex]
      console.log(`🔍 Intentando URL ${urlIndex + 1}/${urls.length}: ${searchUrl}`)
      
      try {
        // Rotar User-Agents para evitar detección
        const userAgents = [
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        const userAgent = userAgents[urlIndex % userAgents.length]
        console.log(`🤖 Usando User-Agent: ${userAgent.substring(0, 50)}...`)
        
        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            // Simular referer real
            'Referer': urlIndex === 0 ? 'https://www.google.com/' : 'https://www.infojobs.net/'
          }
        })

        if (!response.ok) {
          throw new Error(`InfoJobs HTTP ${response.status}: ${response.statusText}`)
        }

        const html = await response.text()
        console.log(`📄 HTML descargado: ${html.length} caracteres`)
        
        // Verificar si el HTML contiene contenido real
        const containsOffers = html.includes('oferta') || html.includes('empleo') || html.includes('trabajo')
        const containsKeywords = html.toLowerCase().includes(keywords.toLowerCase())
        
        console.log(`🔍 Análisis HTML:`,
          `\n   - Contiene ofertas: ${containsOffers}`,
          `\n   - Contiene keywords: ${containsKeywords}`,
          `\n   - Tamaño adecuado: ${html.length > 50000}`
        )
        
        // Si el HTML es sospechosamente pequeño, intentar siguiente URL
        if (html.length < 30000) {
          console.log(`⚠️ HTML pequeño (${html.length} chars) - posible bloqueo, probando siguiente URL...`)
          if (urlIndex === urls.length - 1) {
            // Es la última URL, mostrar debug
            console.log('📄 Muestra HTML obtenido:')
            console.log(html.substring(0, 1000))
          }
          lastError = new Error(`HTML sospechosamente pequeño: ${html.length} chars`)
          continue
        }
        
        // Extraer ofertas reales del HTML
        const offers = this.extractRealOffersFromHTML(html, keywords)
        
        if (offers.length > 0) {
          console.log(`✅ ÉXITO con URL ${urlIndex + 1}: ${offers.length} ofertas encontradas`)
          return offers
        } else {
          console.log(`⚠️ No se encontraron ofertas en URL ${urlIndex + 1}, probando siguiente...`)
          lastError = new Error(`No se encontraron ofertas en ${searchUrl}`)
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`❌ Error con URL ${urlIndex + 1}:`, errorMessage)
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Esperar antes de siguiente intento
        if (urlIndex < urls.length - 1) {
          const retryDelay = Math.floor(Math.random() * 2000) + 1000
          console.log(`⏱️ Esperando ${retryDelay}ms antes del siguiente intento...`)
          await this.delay(retryDelay)
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    console.error('❌ TODOS LOS INTENTOS DE SCRAPING FALLARON')
    throw new Error(`FALLO SCRAPING REAL InfoJobs - Posible bloqueo activo. Último error: ${lastError?.message}`)
  }

  // Método REAL para extraer ofertas del HTML de InfoJobs
  private extractRealOffersFromHTML(html: string, keywords: string): ScrapedJobOffer[] {
    const $ = cheerio.load(html)
    const offers: ScrapedJobOffer[] = []

    console.log('🔍 EXTRAYENDO OFERTAS REALES de InfoJobs HTML...')
    console.log(`🎯 Keywords objetivo: "${keywords}"`)

    // Buscar enlaces de ofertas específicas (evitar enlaces de categorías generales)
    const specificOfferSelectors = [
      'a[href*="/detail/"]',
      'a[href*="/empleo-"]', 
      'a[href*=".aspx"]',
      'a[href*="of-i"]'
    ]
    
    let totalLinks = 0
    const allOfferLinks: any[] = []
    
    specificOfferSelectors.forEach(selector => {
      const links = $(selector)
      totalLinks += links.length
      links.each((i, el) => {
        allOfferLinks.push({ element: el, selector })
      })
      console.log(`🔗 Selector "${selector}": ${links.length} enlaces`)
    })
    
    console.log(`📊 Total enlaces de ofertas específicas: ${totalLinks}`)
    
    // Procesar cada enlace de oferta
    allOfferLinks.forEach(({ element, selector }, index) => {
      const $link = $(element)
      const href = $link.attr('href') || ''
      const titleText = $link.text()?.trim() || $link.attr('title')?.trim() || ''
      
      if (href && titleText && titleText.length > 5) {
        // FILTRO CRÍTICO: Solo ofertas que contengan las keywords específicas
        const titleLower = titleText.toLowerCase()
        const keywordsArray = keywords.toLowerCase().split(' ')
        
        const containsKeywords = keywordsArray.some(keyword => 
          keyword.length > 2 && titleLower.includes(keyword)
        )
        
        // Excluir enlaces de categorías generales y navegación
        const isGenericLink = 
          href.includes('/ofertas-trabajo/') ||  // Categorías generales
          href.includes('/trabajo-') ||        // Enlaces de ciudades
          href.includes('.trabajo.infojobs.net') || // Portales de empresas
          href.includes('/ofertas-empleo') ||   // Página principal
          titleLower.includes('trabajar en') || // "Trabajar en empresa X"
          titleLower.includes('empleo de') ||   // "Empleo de categoría"
          titleLower.includes('trabajo en') ||  // "Trabajo en ciudad"
          titleLower.startsWith('ofertas') ||  // "Ofertas de empleo"
          titleLower === 'trabaja con nosotros' ||
          titleLower.length < 10 // Títulos muy cortos suelen ser navegación
        
        // Solo incluir ofertas específicas que contengan las keywords
        if (containsKeywords && !isGenericLink) {
          // Buscar datos en el contexto del enlace
          const $context = $link.closest('article, div, li, tr').length > 0 ? 
                          $link.closest('article, div, li, tr') : 
                          $link.parent()
          
          // Extraer empresa con múltiples estrategias
          let companyText = ''
          
          // Estrategia 1: Buscar en elementos hermanos
          const siblingText = $link.siblings().text()?.trim()
          if (siblingText && siblingText.length < 100) {
            const words = siblingText.split(/\s+/)
            if (words.length <= 5) { // Probablemente nombre de empresa
              companyText = siblingText
            }
          }
          
          // Estrategia 2: Buscar en elemento padre
          if (!companyText) {
            const parentText = $context.find('span, div, p').not($link).first().text()?.trim()
            if (parentText && parentText.length < 80 && !parentText.toLowerCase().includes('hace')) {
              companyText = parentText
            }
          }
          
          // Estrategia 3: Buscar clases específicas
          if (!companyText) {
            const companySelectors = ['.company', '.empresa', '[data-company]', '.subtitle']
            for (const sel of companySelectors) {
              const companyEl = $context.find(sel).first()
              if (companyEl.length > 0) {
                companyText = companyEl.text()?.trim()
                if (companyText && !companyText.toLowerCase().includes('infojobs')) {
                  break
                }
              }
            }
          }
          
          // Buscar ubicación
          let locationText = 'España'
          const locationKeywords = ['madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao']
          const contextText = $context.text().toLowerCase()
          
          for (const city of locationKeywords) {
            if (contextText.includes(city)) {
              locationText = city.charAt(0).toUpperCase() + city.slice(1)
              break
            }
          }
          
          // Buscar fecha
          let publishDate = null
          const dateRegex = /hace\s+(\d+)\s*(día|semana|mes)/i
          const dateMatch = $context.text().match(dateRegex)
          if (dateMatch) {
            publishDate = dateMatch[0]
          }
          
          // Corregir URL
          let fullUrl = href
          if (href.startsWith('//')) {
            fullUrl = `https:${href}`
          } else if (href.startsWith('/')) {
            fullUrl = `https://www.infojobs.net${href}`
          } else if (!href.startsWith('http')) {
            fullUrl = `https://www.infojobs.net/${href}`
          }
          
          // Limpiar URL duplicada
          fullUrl = fullUrl.replace(/\/\/www\.infojobs\.net\/www\.infojobs\.net/g, '//www.infojobs.net')
          
          // Extraer ID
          const idMatch = href.match(/of-i([a-zA-Z0-9]+)/) || 
                         href.match(/\/([a-zA-Z0-9-]+)\.aspx/) || 
                         href.match(/detail\/([^\/\?]+)/) || 
                         href.match(/empleo-([^\/\?]+)/)
          const realId = idMatch ? idMatch[1] : `scraped-${Date.now()}-${index}`
          
          offers.push({
            title: titleText.substring(0, 100),
            company: companyText.substring(0, 50) || 'Empresa no especificada',
            location: locationText.substring(0, 50),
            salary: null, // Por ahora null, se puede mejorar
            description: `Oferta específica de ${keywords}: ${titleText}`,
            url: fullUrl,
            external_id: realId,
            publishDate: publishDate
          })
          
          console.log(`  ✅ OFERTA ESPECÍFICA: "${titleText.substring(0, 50)}"`) 
          console.log(`     🎯 Keywords: ${keywordsArray.filter(k => titleLower.includes(k)).join(', ')}`)
          console.log(`     🏢 Empresa: "${companyText || 'No especificada'}"`)  
          console.log(`     📍 Ubicación: "${locationText}"`)  
          console.log(`     🔗 URL: ${fullUrl.substring(0, 80)}...`)
        } else if (!containsKeywords) {
          console.log(`  ⏭️ OMITIDO (sin keywords): "${titleText.substring(0, 40)}"`) 
        } else if (isGenericLink) {
          console.log(`  ⏭️ OMITIDO (genérico): "${titleText.substring(0, 40)}"`)
        }
      }
    })

    console.log(`🎯 OFERTAS ESPECÍFICAS EXTRAÍDAS: ${offers.length} (filtradas de ${totalLinks} enlaces)`)
    
    if (offers.length === 0) {
      console.log('⚠️ NO SE ENCONTRARON OFERTAS ESPECÍFICAS')
      console.log('📊 ESTADÍSTICAS DE DEBUG:')
      console.log(`   - HTML tamaño: ${html.length} caracteres`)
      console.log(`   - Keywords buscadas: ${keywords}`)
      console.log(`   - Enlaces totales analizados: ${totalLinks}`)
      
      // Mostrar algunos títulos encontrados para debug
      console.log('📄 Muestra de títulos encontrados:')
      allOfferLinks.slice(0, 5).forEach(({element}, i) => {
        const title = $(element).text()?.trim().substring(0, 50)
        console.log(`   ${i+1}. "${title}"`)
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