import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Probando scraper de InfoJobs...')
    
    // Importar el scraper
    const { InfoJobsScraperSupabase } = await import('@/services/infojobsScraperSupabase')
    const scraper = new InfoJobsScraperSupabase()
    
    // URL de prueba de InfoJobs
    const testUrl = 'https://www.infojobs.net/ofertas-trabajo/programador-react.aspx'
    
    console.log('🎯 Scrapeando URL:', testUrl)
    
    // Ejecutar el scraper
    const offers = await scraper.scrapeInfoJobs(testUrl, 'programador react')
    
    console.log(`✅ Scraping completado. Ofertas encontradas: ${offers.length}`)
    
    return NextResponse.json({
      success: true,
      message: `Scraping completado exitosamente`,
      data: {
        url: testUrl,
        keywords: 'programador react',
        totalOffers: offers.length,
        offers: offers.slice(0, 5) // Solo mostrar las primeras 5 para evitar respuesta muy grande
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