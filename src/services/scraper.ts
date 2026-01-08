import puppeteer from 'puppeteer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface JobOfferData {
  title: string
  company: string
  url: string
  salary?: string
  location?: string
  postedAt?: string
  description?: string
  rawHtml?: string
}

export class InfoJobsScraper {
  private browser: any = null

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      })
      console.log('🚀 InfoJobs scraper inicializado')
    } catch (error) {
      console.error('❌ Error inicializando scraper:', error)
      throw error
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      console.log('🔒 InfoJobs scraper cerrado')
    }
  }

  async scrapeInfoJobs(keywords: string, maxPages: number = 3): Promise<JobOfferData[]> {
    if (!this.browser) {
      await this.init()
    }

    const allOffers: JobOfferData[] = []
    
    try {
      console.log(`🔍 Buscando ofertas para: "${keywords}"`)
      
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Procesando página ${page}/${maxPages}`)
        
        const pageOffers = await this.scrapePage(keywords, page)
        allOffers.push(...pageOffers)
        
        // Pausa entre páginas para evitar ser bloqueados
        await this.delay(2000 + Math.random() * 3000)
      }

      console.log(`✅ Total ofertas encontradas: ${allOffers.length}`)
      return allOffers

    } catch (error) {
      console.error('❌ Error durante scraping:', error)
      throw error
    }
  }

  private async scrapePage(keywords: string, page: number): Promise<JobOfferData[]> {
    const pageOffers: JobOfferData[] = []
    
    const browserPage = await this.browser.newPage()
    
    try {
      // Configurar user agent y headers
      await browserPage.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )
      
      await browserPage.setExtraHTTPHeaders({
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      })

      // Construir URL de búsqueda
      const searchUrl = `https://www.infojobs.net/ofertas-trabajo?q=${encodeURIComponent(keywords)}&page=${page}`
      console.log(`🌐 Navegando a: ${searchUrl}`)
      
      await browserPage.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      // Esperar a que carguen las ofertas
      await browserPage.waitForSelector('.offer-item, .js-offer-list-item, [data-testid="offer-item"]', { 
        timeout: 15000 
      })

      // Extraer ofertas de la página
      const offers = await browserPage.evaluate(() => {
        const offerElements = document.querySelectorAll('.offer-item, .js-offer-list-item, [data-testid="offer-item"]')
        const results: any[] = []

        offerElements.forEach((element) => {
          try {
            // Título y enlace
            const titleElement = element.querySelector('a[data-testid="offer-title"], .offer-item-title a, .js-offer-title')
            const title = titleElement?.textContent?.trim() || ''
            const relativeUrl = titleElement?.getAttribute('href') || ''
            const url = relativeUrl.startsWith('http') ? relativeUrl : `https://www.infojobs.net${relativeUrl}`

            // Empresa
            const companyElement = element.querySelector('[data-testid="company-name"], .offer-item-company, .js-offer-company')
            const company = companyElement?.textContent?.trim() || ''

            // Ubicación
            const locationElement = element.querySelector('[data-testid="offer-location"], .offer-item-location, .js-offer-location')
            const location = locationElement?.textContent?.trim() || ''

            // Salario
            const salaryElement = element.querySelector('[data-testid="offer-salary"], .offer-item-salary, .js-offer-salary')
            const salary = salaryElement?.textContent?.trim() || ''

            // Fecha de publicación
            const dateElement = element.querySelector('[data-testid="offer-date"], .offer-item-date, .js-offer-date')
            const postedAt = dateElement?.textContent?.trim() || ''

            // Descripción corta
            const descElement = element.querySelector('.offer-item-excerpt, .js-offer-excerpt')
            const description = descElement?.textContent?.trim() || ''

            if (title && company && url) {
              results.push({
                title,
                company,
                url,
                location: location || undefined,
                salary: salary || undefined,
                postedAt: postedAt || undefined,
                description: description || undefined,
                rawHtml: element.innerHTML
              })
            }
          } catch (error) {
            console.warn('⚠️ Error procesando elemento:', error)
          }
        })

        return results
      })

      pageOffers.push(...offers)
      console.log(`📋 Ofertas extraídas de página ${page}: ${offers.length}`)

    } catch (error) {
      console.error(`❌ Error procesando página ${page}:`, error)
    } finally {
      await browserPage.close()
    }

    return pageOffers
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Función principal para scraping
export async function scrapeInfoJobs(keywords: string): Promise<JobOfferData[]> {
  const scraper = new InfoJobsScraper()
  
  try {
    const offers = await scraper.scrapeInfoJobs(keywords)
    return offers
  } finally {
    await scraper.close()
  }
}

// Función para guardar ofertas evitando duplicados
export async function saveJobOffers(jobSearchId: string, offers: JobOfferData[]): Promise<number> {
  let savedCount = 0
  
  try {
    for (const offer of offers) {
      try {
        // Verificar si ya existe por URL
        const existing = await prisma.jobOffer.findUnique({
          where: { url: offer.url }
        })

        if (!existing) {
          await prisma.jobOffer.create({
            data: {
              jobSearchId,
              title: offer.title,
              company: offer.company,
              url: offer.url,
              salary: offer.salary,
              location: offer.location,
              postedAt: offer.postedAt,
              description: offer.description,
              rawHtml: offer.rawHtml,
              status: 'ACTIVE'
            }
          })
          savedCount++
          console.log(`✅ Nueva oferta guardada: ${offer.title} - ${offer.company}`)
        } else {
          console.log(`⏭️ Oferta ya existe: ${offer.title} - ${offer.company}`)
        }
      } catch (error) {
        console.error(`❌ Error guardando oferta "${offer.title}":`, error)
      }
    }

    console.log(`📊 Resultado: ${savedCount} nuevas ofertas de ${offers.length} encontradas`)
    return savedCount

  } catch (error) {
    console.error('❌ Error general guardando ofertas:', error)
    throw error
  }
}