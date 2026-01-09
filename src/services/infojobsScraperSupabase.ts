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
      // Configuración específica para entornos de producción (Vercel)
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
      
      if (isProduction) {
        // En producción usamos puppeteer-core con @sparticuz/chromium
        const puppeteerCore = await import('puppeteer-core')
        const chromium = await import('@sparticuz/chromium')
        
        browser = await puppeteerCore.default.launch({
          headless: true,
          executablePath: await chromium.default.executablePath(),
          args: [
            ...chromium.default.args,
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-features=TranslateUI',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          defaultViewport: null
        })
      } else {
        // En desarrollo usamos puppeteer normal
        const puppeteerDev = await import('puppeteer')
        
        browser = await puppeteerDev.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-extensions',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-features=TranslateUI'
          ],
          defaultViewport: null
        })
      }

      const page: Page = await browser.newPage()
      
      // Configurar para evitar detección de bot
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
        Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es'] })
        ;(window as any).chrome = { runtime: {} }
      })

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      await page.setViewport({ width: 1920, height: 1080 })

      // Configurar headers adicionales
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      })

      console.log(`📱 Navegando a InfoJobs...`)
      
      // Navegar con timeout extendido y estrategia de carga completa
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 45000 
      })

      console.log(`⏳ Esperando a que carguen las ofertas...`)

      // Esperar múltiples indicadores de que la página está cargada
      await Promise.race([
        page.waitForSelector('article', { timeout: 20000 }),
        page.waitForSelector('[data-testid]', { timeout: 20000 }),
        page.waitForSelector('.list-group', { timeout: 20000 }),
        new Promise(resolve => setTimeout(resolve, 10000)) // timeout fallback
      ]).catch(() => console.log('⚠️ Timeout esperando selectores, continuando...'))

      // Esperar que se complete la carga de JavaScript
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Scroll down para activar lazy loading si existe
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Obtener el HTML renderizado
      const html = await page.content()
      console.log(`📄 HTML obtenido, tamaño: ${html.length} caracteres`)

      // DEBUG: Guardar fragmentos del HTML para análisis
      console.log('🔍 DEBUG: Buscando indicadores de ofertas en HTML...')
      
      const bodyText = await page.evaluate(() => document.body.innerText)
      console.log(`📝 Texto del body (primeros 500 chars): ${bodyText.substring(0, 500)}`)
      
      // Verificar si hay elementos que indiquen ofertas
      const hasOfferElements = await page.evaluate(() => {
        const selectors = [
          'article',
          '[data-testid*="offer"]',
          '[class*="offer"]',
          '[class*="job"]',
          'a[href*="detail"]'
        ]
        
        const results: { [key: string]: number } = {}
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          results[selector] = elements.length
        })
        
        return results
      })
      
      console.log('🔍 DEBUG: Elementos encontrados por selector:', hasOfferElements)
      
      // Verificar si hay texto relacionado con ofertas
      const offerKeywords = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase()
        return {
          'ofertas': text.includes('ofertas'),
          'empleo': text.includes('empleo'),
          'trabajo': text.includes('trabajo'),
          'desarrollador': text.includes('desarrollador'),
          'react': text.includes('react')
        }
      })
      
      console.log('🔍 DEBUG: Palabras clave encontradas:', offerKeywords)

      return this.parseJobOffersWithDebug(html)

    } catch (error) {
      console.error('❌ Error usando Puppeteer:', error)
      throw new Error(`Error scrapeando con Puppeteer: ${error}`)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  private parseJobOffersWithDebug(html: string): ScrapedJobOffer[] {
    const $ = cheerio.load(html)
    const offers: ScrapedJobOffer[] = []

    console.log('🔍 Parseando ofertas de trabajo con DEBUG...')

    // Selectores más amplios para encontrar la estructura actual de InfoJobs
    const allSelectors = [
      // Selectores específicos InfoJobs actuales
      'article[data-id]',
      'article[class*="offer"]',
      'article[class*="job"]',
      'div[data-testid*="offer"]',
      'li[class*="offer"]',
      
      // Selectores genéricos
      'article',
      '.list-group-item',
      '[data-testid]',
      'li',
      
      // Selectores de enlaces
      'a[href*="infojobs.net"]',
      'a[href*="/detail/"]',
      'a[href*="/empleo/"]'
    ]

    // Probar cada selector y ver qué encuentra
    let bestSelector = null
    let maxElements = 0

    for (const selector of allSelectors) {
      const elements = $(selector)
      console.log(`🔍 Selector "${selector}": ${elements.length} elementos`)
      
      if (elements.length > maxElements) {
        maxElements = elements.length
        bestSelector = selector
      }
    }

    console.log(`✅ Mejor selector encontrado: "${bestSelector}" con ${maxElements} elementos`)

    if (bestSelector && maxElements > 0) {
      const elements = $(bestSelector)
      
      elements.each((index: number, element: any) => {
        const $element = $(element)
        
        console.log(`🔍 Analizando elemento ${index + 1}...`)
        
        // Buscar enlaces dentro del elemento
        const links = $element.find('a[href*="detail"], a[href*="empleo"], a[href]')
        console.log(`  Enlaces encontrados: ${links.length}`)
        
        // Buscar texto que pueda ser el título
        const allTexts: string[] = []
        $element.find('*').each((_, child) => {
          const text = $(child).clone().children().remove().end().text().trim()
          if (text && text.length > 10 && text.length < 100) {
            allTexts.push(text)
          }
        })
        
        console.log(`  Textos candidatos: ${allTexts.slice(0, 3).join(' | ')}`)
        
        // Buscar enlace principal
        let mainLink: string | null = null
        links.each((_, link) => {
          const href = $(link).attr('href')
          if (href && (href.includes('detail') || href.includes('empleo'))) {
            mainLink = href
            return false // break
          }
        })
        
        if (mainLink && typeof mainLink === 'string') {
          const title = allTexts.find(text => 
            text.toLowerCase().includes('desarrollador') ||
            text.toLowerCase().includes('programador') ||
            text.toLowerCase().includes('react') ||
            text.toLowerCase().includes('frontend') ||
            text.toLowerCase().includes('software')
          ) || allTexts[0] || 'Título extraído'
          
          console.log(`  ✅ Oferta encontrada: "${title}" - ${mainLink}`)
          
          const linkStr = String(mainLink)
          const fullUrl = linkStr.startsWith('http') ? linkStr : `https://www.infojobs.net${linkStr}`
          const externalId = linkStr.match(/\/([a-zA-Z0-9]+)/g)?.pop()?.replace('/', '') || null
          
          offers.push({
            title,
            company: null, // extraer después
            location: null, // extraer después
            salary: null, // extraer después
            description: null,
            url: fullUrl,
            external_id: externalId
          })
        } else {
          console.log(`  ❌ No se encontró enlace válido en elemento ${index + 1}`)
        }
      })
    }

    // Fallback: buscar todos los enlaces que contengan palabras clave
    if (offers.length === 0) {
      console.log('🔍 Fallback: Buscando enlaces con palabras clave...')
      
      const allLinks = $('a[href]')
      console.log(`🔗 Total de enlaces encontrados: ${allLinks.length}`)
      
      allLinks.each((_, link) => {
        const $link = $(link)
        const href = $link.attr('href')
        const text = $link.text().trim()
        
        if (href && text && 
           (text.toLowerCase().includes('desarrollador') ||
            text.toLowerCase().includes('programador') ||
            text.toLowerCase().includes('react') ||
            text.toLowerCase().includes('frontend') ||
            text.toLowerCase().includes('software'))) {
          
          console.log(`🎯 Enlace candidato encontrado: "${text}" -> ${href}`)
          
          const fullUrl = href.startsWith('http') ? href : `https://www.infojobs.net${href}`
          const externalId = href.match(/\/([a-zA-Z0-9]+)/g)?.pop()?.replace('/', '') || null
          
          offers.push({
            title: text,
            company: null,
            location: null,
            salary: null,
            description: null,
            url: fullUrl,
            external_id: externalId
          })
        }
      })
    }

    console.log(`📊 DEBUG: Total ofertas parseadas: ${offers.length}`)
    
    // Mostrar las primeras ofertas encontradas
    if (offers.length > 0) {
      console.log('🎯 Ofertas encontradas:')
      offers.slice(0, 3).forEach((offer, index) => {
        console.log(`  ${index + 1}. ${offer.title}`)
        console.log(`     URL: ${offer.url}`)
      })
    } else {
      console.log('❌ No se encontraron ofertas')
      
      // Debug final: mostrar muestra del HTML
      console.log('📄 Muestra del HTML (primeros 1000 chars):')
      console.log(html.substring(0, 1000))
    }
    
    return offers
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