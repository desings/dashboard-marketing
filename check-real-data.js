// Verificar datos reales en Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rgmltuyfabxomkplvzij.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbWx0dXlmYWJ4b21rcGx2emlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTEyOTc0MywiZXhwIjoyMDUwNzA1NzQzfQ.L0hO5CL2KUnOxLFSmRrnGv0DjKCd6lE4zAqAq2KH9oA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRealData() {
  try {
    console.log('🔍 Verificando datos reales en Supabase...')

    // Verificar ofertas recientes
    const { data: offers, error, count } = await supabase
      .from('job_offers')
      .select(`
        id,
        title,
        company,
        location,
        created_at,
        job_search_id,
        job_searches!inner(user_id, keywords)
      `, { count: 'exact' })
      .eq('job_searches.user_id', 'user-1')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log(`\n✅ TOTAL DE OFERTAS ACTIVAS: ${count}`)
    
    if (offers && offers.length > 0) {
      console.log('\n📋 OFERTAS MÁS RECIENTES:')
      offers.forEach((offer, index) => {
        console.log(`   ${index + 1}. ${offer.title}`)
        console.log(`      🏢 ${offer.company} | 📍 ${offer.location}`)
        console.log(`      🔍 Búsqueda: "${offer.job_searches.keywords}"`)
        console.log(`      📅 ${new Date(offer.created_at).toLocaleString('es-ES')}`)
        console.log('')
      })

      console.log('🎯 DATOS DISPONIBLES PARA:')
      console.log('   • Paginación: Página 1 de', Math.ceil(count / 10))
      console.log('   • Filtrado por búsqueda, empresa, ubicación')
      console.log('   • Ordenado por fecha más reciente')
    } else {
      console.log('❌ No hay ofertas activas')
    }

  } catch (error) {
    console.error('❌ Error verificando datos:', error)
  }
}

checkRealData()
  .then(() => {
    console.log('\n💡 Si las ofertas existen pero el dashboard no las muestra,')
    console.log('   el problema está en la configuración de la API en Vercel.')
  })
  .catch(console.error)