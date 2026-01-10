// Test específico de scraping con análisis del HTML
const https = require('https');
const cheerio = require('cheerio');

async function testDebugScraper() {
  console.log('🧪 TEST ESPECÍFICO: Análisis del HTML de InfoJobs');
  
  const searchUrl = 'https://www.infojobs.net/ofertas-trabajo?keyword=desarrollador%20react&page=1';
  console.log(`🔍 Descargando: ${searchUrl}`);
  
  try {
    const html = await downloadPage(searchUrl);
    console.log(`📄 HTML descargado: ${html.length} caracteres`);
    console.log(`🔍 Contiene "oferta": ${html.includes('oferta')}`);
    console.log(`🔍 Contiene "desarrollador": ${html.includes('desarrollador')}`);
    
    const $ = cheerio.load(html);
    
    // Buscar enlaces específicos
    const detailLinks = $('a[href*="/detail/"]');
    const empleoLinks = $('a[href*="/empleo-"]');  
    const aspxLinks = $('a[href*=".aspx"]');
    
    console.log(`🔗 Enlaces "/detail/": ${detailLinks.length}`);
    console.log(`🔗 Enlaces "/empleo-": ${empleoLinks.length}`);
    console.log(`🔗 Enlaces ".aspx": ${aspxLinks.length}`);
    
    // Mostrar algunos enlaces encontrados
    console.log('\n📋 PRIMEROS 10 ENLACES ENCONTRADOS:');
    $('a[href*="infojobs"], a[href*="/detail/"], a[href*="/empleo-"]').slice(0, 10).each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().substring(0, 60);
      console.log(`${i + 1}. "${text}" -> ${href}`);
    });
    
    // Buscar en el HTML algunos patrones específicos
    console.log('\n🔍 BÚSQUEDA DE PATRONES:');
    console.log(`- "SADE": ${html.includes('SADE')}`);
    console.log(`- "Consultoria": ${html.includes('Consultoria')}`);
    console.log(`- "React": ${html.includes('React')}`);
    console.log(`- "ofertas": ${html.includes('ofertas')}`);
    
    // Mostrar estructura de algunos elementos
    console.log('\n🏗️ ESTRUCTURA HTML:');
    $('article, [data-testid], .offer').slice(0, 3).each((i, el) => {
      console.log(`Elemento ${i + 1}: ${$(el).get(0).tagName} - classes: ${$(el).attr('class') || 'sin clase'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function downloadPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

testDebugScraper();