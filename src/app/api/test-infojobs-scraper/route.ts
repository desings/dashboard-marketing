import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Probando scraper de InfoJobs...')
    
    // Importar el scraper
    const { InfoJobsScraperSupabase } = await import('@/services/infojobsScraperSupabase')
    const scraper = new InfoJobsScraperSupabase()
    
    // Ejecutar el scraper (usando un job search ID temporal para pruebas)
    const keywords = 'programador react'
    const testJobSearchId = 'test-search-id'
    
    console.log(`🎯 Scrapeando InfoJobs para: "${keywords}"`)
    
    // Ejecutar el scraper
    const result = await scraper.scrapeJobOffers(keywords, testJobSearchId, 1) // Solo 1 página para prueba
    
    console.log(`✅ Scraping completado. Ofertas procesadas: ${result.totalProcessed}, nuevas: ${result.newOffersCount}`)
    
    return NextResponse.json({
      success: true,
      message: `Scraping completado exitosamente`,
      data: {
        keywords: keywords,
        jobSearchId: testJobSearchId,
        totalProcessed: result.totalProcessed,
        newOffersCount: result.newOffersCount,
        errors: result.errors
      }
    })
    
  } catch (error) {
    console.error('❌ Error en test scraper:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}