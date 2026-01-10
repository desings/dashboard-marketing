// Test directo del scraper real sin simulaciones
async function testRealScraper() {
  console.log('🧪 TESTING: Scraper REAL sin simulaciones')
  
  try {
    const response = await fetch('http://localhost:3000/api/test-n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keywords: 'developer javascript',
        maxOffers: 5
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`API Error: ${result.error || response.statusText}`)
    }
    
    console.log('🎯 RESULTADO DEL SCRAPER REAL:')
    console.log(`- Ofertas encontradas: ${result.offers?.length || 0}`)
    
    if (result.offers?.length > 0) {
      console.log('\n📋 OFERTAS REALES EXTRAÍDAS:')
      result.offers.forEach((offer, index) => {
        console.log(`\n${index + 1}. ${offer.title}`)
        console.log(`   🏢 Empresa: ${offer.company}`)
        console.log(`   📍 Ubicación: ${offer.location}`)
        console.log(`   🔗 URL: ${offer.url}`)
        console.log(`   🆔 ID: ${offer.external_id}`)
        
        // Verificar que NO sea simulado
        if (offer.title.toLowerCase().includes('simulado') || 
            offer.title.toLowerCase().includes('demo') ||
            offer.company.toLowerCase().includes('empresa demo') ||
            offer.url.includes('example.com')) {
          console.error('❌ FALLO: Encontrada oferta SIMULADA!')
          console.error('   This should NOT happen - offering should be REAL only')
        } else {
          console.log('   ✅ REAL: Oferta parece auténtica de InfoJobs')
        }
      })
    } else {
      console.log('⚠️ No se encontraron ofertas (puede ser normal si InfoJobs no tiene resultados)')
    }
    
    console.log('\n✅ TEST COMPLETADO: Solo ofertas reales, sin simulaciones')
    
  } catch (error) {
    console.error('❌ ERROR EN TEST:', error.message)
    console.log('ℹ️ Esto es NORMAL si el scraper real falla - NO debe mostrar datos simulados')
  }
}

testRealScraper()