import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CompanyData {
  name?: string
  website?: string
  email?: string
  phone?: string
  address?: string
  source: string
}

export class CompanyEnrichmentService {
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
      console.log('🔍 Servicio de enriquecimiento inicializado')
    } catch (error) {
      console.error('❌ Error inicializando enriquecimiento:', error)
      throw error
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      console.log('🔒 Servicio de enriquecimiento cerrado')
    }
  }

  async enrichCompanyFromJobUrl(jobOfferUrl: string): Promise<CompanyData | null> {
    if (!this.browser) {
      await this.init()
    }

    try {
      console.log(`🔍 Enriqueciendo empresa desde: ${jobOfferUrl}`)
      
      // Primero extraer información de la página de la oferta
      const jobPageData = await this.scrapeJobOfferPage(jobOfferUrl)
      
      if (jobPageData) {
        // Si encontramos website, intentar extraer más datos
        if (jobPageData.website) {
          console.log(`🌐 Website encontrado: ${jobPageData.website}`)
          const websiteData = await this.scrapeCompanyWebsite(jobPageData.website)
          
          return {
            ...jobPageData,
            ...websiteData,
            source: 'scraping'
          }
        }
        
        return {
          ...jobPageData,
          source: 'scraping'
        }
      }

      return null

    } catch (error) {
      console.error(`❌ Error enriqueciendo empresa:`, error)
      return null
    }
  }

  private async scrapeJobOfferPage(url: string): Promise<Partial<CompanyData> | null> {
    const page = await this.browser.newPage()
    
    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )
      
      console.log(`📄 Analizando página de oferta: ${url}`)
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })

      const data = await page.evaluate(() => {
        const result: any = {}

        // Buscar nombre de la empresa
        const companySelectors = [
          '.company-name',
          '.offer-company-name',
          '[data-testid="company-name"]',
          '.js-company-name',
          'h2 a[href*="empresa"]',
          '.employer-name'
        ]

        for (const selector of companySelectors) {
          const element = document.querySelector(selector)
          if (element && element.textContent?.trim()) {
            result.name = element.textContent.trim()
            break
          }
        }

        // Buscar website de la empresa
        const websiteSelectors = [
          'a[href*="www."]',
          'a[href^="http"]:not([href*="infojobs"]):not([href*="linkedin"])',
          '.company-website a',
          '[data-testid="company-website"]'
        ]

        for (const selector of websiteSelectors) {
          const element = document.querySelector(selector)
          if (element && element.getAttribute('href')) {
            const href = element.getAttribute('href')
            if (href && (href.includes('www.') || href.startsWith('http')) && 
                !href.includes('infojobs') && !href.includes('linkedin') && 
                !href.includes('facebook') && !href.includes('twitter')) {
              result.website = href.startsWith('http') ? href : `https://${href}`
              break
            }
          }
        }

        // Buscar email (en el texto de la página)
        const pageText = document.body.innerText || ''
        const emailMatch = pageText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)
        if (emailMatch && emailMatch[0]) {
          result.email = emailMatch[0]
        }

        // Buscar teléfono (en el texto de la página)
        const phoneMatch = pageText.match(/(\+34\s*)?[6-9]\d{2}\s*\d{3}\s*\d{3}|(\+34\s*)?[8-9]\d{1}\s*\d{3}\s*\d{2}\s*\d{2}/g)
        if (phoneMatch && phoneMatch[0]) {
          result.phone = phoneMatch[0].replace(/\s+/g, ' ').trim()
        }

        // Buscar dirección
        const addressSelectors = [
          '.company-address',
          '.offer-location',
          '[data-testid="company-address"]'
        ]

        for (const selector of addressSelectors) {
          const element = document.querySelector(selector)
          if (element && element.textContent?.trim() && element.textContent.length > 5) {
            result.address = element.textContent.trim()
            break
          }
        }

        return result
      })

      console.log(`📊 Datos extraídos de oferta:`, data)
      return data

    } catch (error) {
      console.error(`❌ Error scrapeando página de oferta:`, error)
      return null
    } finally {
      await page.close()
    }
  }

  private async scrapeCompanyWebsite(websiteUrl: string): Promise<Partial<CompanyData> | null> {
    const page = await this.browser.newPage()
    
    try {
      console.log(`🌐 Analizando website de empresa: ${websiteUrl}`)
      
      await page.goto(websiteUrl, { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
      })

      const data = await page.evaluate(() => {
        const result: any = {}

        // Buscar email en la página de contacto o footer
        const pageText = document.body.innerText || ''
        const emails = pageText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)
        if (emails && emails.length > 0) {
          // Filtrar emails comunes y quedarnos con el más relevante
          const filteredEmails = emails.filter(email => 
            !email.includes('noreply') && 
            !email.includes('no-reply') && 
            !email.includes('newsletter') &&
            !email.includes('marketing')
          )
          if (filteredEmails.length > 0) {
            result.email = filteredEmails[0]
          }
        }

        // Buscar teléfonos
        const phones = pageText.match(/(\+34\s*)?[6-9]\d{2}\s*\d{3}\s*\d{3}|(\+34\s*)?[8-9]\d{1}\s*\d{3}\s*\d{2}\s*\d{2}/g)
        if (phones && phones.length > 0) {
          result.phone = phones[0].replace(/\s+/g, ' ').trim()
        }

        // Buscar dirección en footer o página de contacto
        const addressKeywords = ['dirección', 'direccion', 'address', 'ubicación', 'ubicacion', 'sede']
        const elements = document.querySelectorAll('*')
        
        for (const element of elements) {
          const text = element.textContent?.toLowerCase() || ''
          for (const keyword of addressKeywords) {
            if (text.includes(keyword) && text.length > 20 && text.length < 200) {
              result.address = element.textContent?.trim()
              break
            }
          }
          if (result.address) break
        }

        return result
      })

      console.log(`📊 Datos adicionales de website:`, data)
      return data

    } catch (error) {
      console.error(`❌ Error scrapeando website de empresa:`, error)
      return null
    } finally {
      await page.close()
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Función principal para enriquecer empresa
export async function enrichCompany(jobOfferId: string): Promise<CompanyData | null> {
  try {
    // Obtener la oferta de trabajo
    const jobOffer = await prisma.jobOffer.findUnique({
      where: { id: jobOfferId },
      include: { companyProfile: true }
    })

    if (!jobOffer) {
      console.error('❌ Oferta no encontrada:', jobOfferId)
      return null
    }

    // Si ya tiene perfil de empresa, no volver a enriquecer
    if (jobOffer.companyProfile) {
      console.log('⏭️ Empresa ya enriquecida:', jobOffer.companyProfile.name)
      return null
    }

    const enrichmentService = new CompanyEnrichmentService()
    
    try {
      const companyData = await enrichmentService.enrichCompanyFromJobUrl(jobOffer.url)
      
      if (companyData) {
        // Guardar los datos enriquecidos
        const savedProfile = await prisma.companyProfile.create({
          data: {
            jobOfferId: jobOffer.id,
            name: companyData.name || jobOffer.company,
            website: companyData.website,
            email: companyData.email,
            phone: companyData.phone,
            address: companyData.address,
            source: companyData.source
          }
        })

        console.log(`✅ Empresa enriquecida: ${savedProfile.name}`)
        return companyData
      }

      return null

    } finally {
      await enrichmentService.close()
    }

  } catch (error) {
    console.error('❌ Error enriqueciendo empresa:', error)
    throw error
  }
}

// Función para enriquecer automáticamente cuando se marca como interesante
export async function autoEnrichOnInterest(jobOfferId: string): Promise<void> {
  try {
    console.log(`🔄 Auto-enriquecimiento para oferta: ${jobOfferId}`)
    
    // Enriquecer en background (no bloquear la respuesta)
    enrichCompany(jobOfferId).catch(error => {
      console.error('❌ Error en auto-enriquecimiento:', error)
    })

  } catch (error) {
    console.error('❌ Error iniciando auto-enriquecimiento:', error)
  }
}