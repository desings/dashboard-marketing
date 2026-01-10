// Verificar que Node.js pueda usar imports ES6
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase usando variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgmltuyfabxomkplvzij.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Configuración Supabase:')
console.log('   URL:', supabaseUrl)
console.log('   Key disponible:', supabaseKey ? 'Sí ✅' : 'No ❌')

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no encontrada')
  console.log('💡 Ejecuta: source .env.local && node create-sample-offers.js')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleOffers() {
  try {
    console.log('🔄 Creando ofertas de ejemplo...')

    // Primero verificar si existe la búsqueda
    const { data: existingSearch } = await supabase
      .from('job_searches')
      .select('id')
      .eq('id', '2eba7ce6-edee-479d-8a5b-7d7dfc2ac5c3')
      .single()

    if (!existingSearch) {
      console.log('📝 Creando búsqueda de ejemplo...')
      await supabase
        .from('job_searches')
        .insert({
          id: '2eba7ce6-edee-479d-8a5b-7d7dfc2ac5c3',
          user_id: 'user-1',
          keywords: 'nodejs developer',
          portals: ['infojobs'],
          frequency_minutes: 60,
          is_active: true
        })
    }

    // Crear ofertas específicas de ejemplo con el filtrado mejorado
    const sampleOffers = [
      {
        job_search_id: '2eba7ce6-edee-479d-8a5b-7d7dfc2ac5c3',
        title: 'Desarrollador Node.js Senior - Madrid',
        company: 'TechCorp Solutions',
        location: 'Madrid, España',
        salary: '45.000-55.000 €',
        description: 'Buscamos desarrollador Node.js con experiencia en APIs REST, MongoDB y AWS para nuestro equipo de backend.',
        url: 'https://www.infojobs.net/empleo-desarrollador-nodejs-senior-madrid',
        portal: 'infojobs',
        status: 'ACTIVE',
        external_id: 'node-senior-001',
        posted_at: new Date().toISOString()
      },
      {
        job_search_id: '2eba7ce6-edee-479d-8a5b-7d7dfc2ac5c3',
        title: 'Full Stack Developer JavaScript - React/Node.js',
        company: 'StartupInnovadora',
        location: 'Barcelona, España',
        salary: '40.000-50.000 €',
        description: 'Oportunidad en startup para desarrollador full-stack con React, Node.js, TypeScript y experiencia en microservicios.',
        url: 'https://www.infojobs.net/empleo-fullstack-javascript-react-nodejs',
        portal: 'infojobs',
        status: 'ACTIVE',
        external_id: 'fullstack-js-002',
        posted_at: new Date(Date.now() - 3600000).toISOString() // hace 1 hora
      },
      {
        job_search_id: '2eba7ce6-edee-479d-8a5b-7d7dfc2ac5c3',
        title: 'Backend Developer Node.js - Remoto',
        company: 'DigitalAgency Pro',
        location: 'Remoto, España',
        salary: '38.000-48.000 €',
        description: 'Desarrollador backend con Node.js, Express, PostgreSQL para proyectos de transformación digital.',
        url: 'https://www.infojobs.net/empleo-backend-nodejs-remoto',
        portal: 'infojobs',
        status: 'ACTIVE',
        external_id: 'backend-remote-003',
        posted_at: new Date(Date.now() - 7200000).toISOString() // hace 2 horas
      },
      {
        job_search_id: '2eba7ce6-edee-479d-8a5b-7d7dfc2ac5c3',
        title: 'JavaScript Developer - Vue.js y Node.js',
        company: 'WebSolutions Inc',
        location: 'Valencia, España',
        salary: '35.000-45.000 €',
        description: 'Desarrollador JavaScript para proyectos web con Vue.js en frontend y Node.js en backend.',
        url: 'https://www.infojobs.net/empleo-javascript-vue-nodejs',
        portal: 'infojobs',
        status: 'ACTIVE',
        external_id: 'js-vue-node-004',
        posted_at: new Date(Date.now() - 10800000).toISOString() // hace 3 horas
      },
      {
        job_search_id: '2eba7ce6-edee-479d-8a5b-7d7dfc2ac5c3',
        title: 'Node.js Architect - Microservicios',
        company: 'Enterprise Systems',
        location: 'Madrid, España',
        salary: '60.000-70.000 €',
        description: 'Arquitecto de software con amplia experiencia en Node.js, microservicios, Docker, Kubernetes.',
        url: 'https://www.infojobs.net/empleo-nodejs-architect-microservices',
        portal: 'infojobs',
        status: 'ACTIVE',
        external_id: 'node-architect-005',
        posted_at: new Date(Date.now() - 14400000).toISOString() // hace 4 horas
      }
    ]

    // Eliminar ofertas existentes del mismo job_search para evitar duplicados
    await supabase
      .from('job_offers')
      .delete()
      .eq('job_search_id', '2eba7ce6-edee-479d-8a5b-7d7dfc2ac5c3')

    // Insertar nuevas ofertas
    const { data, error } = await supabase
      .from('job_offers')
      .insert(sampleOffers)

    if (error) {
      throw error
    }

    console.log('✅ Ofertas de ejemplo creadas exitosamente:')
    sampleOffers.forEach((offer, index) => {
      console.log(`   ${index + 1}. ${offer.title} - ${offer.company}`)
    })

    console.log('\n🎯 Estas ofertas cumplen con el filtrado específico:')
    console.log('   ✓ Contienen keywords relevantes (Node.js, JavaScript, Desarrollador)')
    console.log('   ✓ NO son enlaces genéricos como "Trabajar en empresa X"')
    console.log('   ✓ Tienen información completa de empresa y ubicación')
    console.log('   ✓ Están ordenadas por fecha de publicación más reciente')

  } catch (error) {
    console.error('❌ Error creando ofertas de ejemplo:', error)
  }
}

createSampleOffers()
  .then(() => {
    console.log('\n🏁 Ofertas de ejemplo listas para mostrar en el dashboard')
    console.log('🔗 Visita: https://dashboard-marketing-a62m.vercel.app/dashboard/clientes/ofertas')
  })
  .catch(console.error)