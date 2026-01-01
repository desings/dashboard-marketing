#!/usr/bin/env node

/**
 * Script para configurar un token permanente de Facebook
 * 
 * Uso:
 * node scripts/setup-permanent-facebook-token.js [tu_token_actual]
 */

const https = require('https');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTZiOThjNy0xNmU1LTQ4OTItYmQ3Zi04OGRkMGQ5MTEwYzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2MjczNTUwfQ.pNLitIIybnhMc3ypYcW3g4tqO655H8yItQDi5c5zP6w';
const N8N_BASE_URL = 'vmi2907616.contaboserver.net';
const FACEBOOK_APP_ID = '1314977153875955';
const FACEBOOK_APP_SECRET = 'a797d865b513dc152ed306d420ee581c';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: N8N_BASE_URL,
      port: 443,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function exchangeForLongToken(shortToken) {
  console.log('🔄 Convirtiendo a long-lived token...');
  
  const url = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortToken}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.access_token) {
            console.log('✅ Long-lived token obtenido');
            console.log('⏰ Expires in:', result.expires_in, 'seconds');
            resolve(result.access_token);
          } else {
            reject(new Error('No se pudo obtener long token: ' + data));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getPageTokens(userToken) {
  console.log('📄 Obteniendo Page Access Tokens...');
  
  const url = `https://graph.facebook.com/me/accounts?access_token=${userToken}&fields=name,access_token,id`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data) {
            console.log('✅ Page tokens obtenidos:');
            result.data.forEach(page => {
              console.log(`  📖 ${page.name} (ID: ${page.id})`);
              console.log(`  🔑 Token: ${page.access_token.substring(0, 20)}...`);
            });
            resolve(result.data);
          } else {
            reject(new Error('No se pudieron obtener page tokens: ' + data));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function updateCredential(credentialId, newToken) {
  console.log('🔧 Actualizando credencial en n8n...');
  
  // Nota: La API de n8n puede no permitir actualizar credenciales directamente
  // En este caso, necesitarías hacerlo manualmente desde la UI
  console.log('⚠️  Actualiza manualmente la credencial en n8n con el nuevo token');
  console.log('🆔 Credential ID:', credentialId);
  console.log('🔑 Nuevo Token:', newToken);
}

async function main() {
  const userToken = process.argv[2];
  
  if (!userToken) {
    console.log('❌ Error: Debes proporcionar tu token actual');
    console.log('💡 Uso: node scripts/setup-permanent-facebook-token.js [tu_token]');
    process.exit(1);
  }

  try {
    // Paso 1: Convertir a long-lived token (60 días)
    const longToken = await exchangeForLongToken(userToken);
    
    // Paso 2: Obtener Page Access Tokens (permanentes)
    const pageTokens = await getPageTokens(longToken);
    
    // Paso 3: Mostrar instrucciones
    console.log('\n🎯 INSTRUCCIONES PARA TOKEN PERMANENTE:');
    console.log('1. Ve a n8n: https://vmi2907616.contaboserver.net');
    console.log('2. Busca la credencial "FB TOKEN"');
    console.log('3. Reemplaza el Access Token con uno de los Page Tokens de arriba');
    console.log('4. ✅ ¡El Page Token NUNCA caduca!');
    
    if (pageTokens.length > 0) {
      console.log('\n🏆 TOKEN RECOMENDADO (usa este):');
      console.log(`🔑 ${pageTokens[0].access_token}`);
      console.log(`📖 Para la página: ${pageTokens[0].name}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();