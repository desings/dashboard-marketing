#!/usr/bin/env node

/**
 * Script para obtener y renovar automáticamente tokens de Facebook
 * Ejecutar: node scripts/refresh-facebook-token.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración (actualizar con tus valores reales)
const CONFIG = {
  appId: process.env.FACEBOOK_APP_ID || '1471973731158683',
  appSecret: process.env.FACEBOOK_APP_SECRET || '', // NECESITAS PONER EL APP SECRET REAL
  currentToken: process.env.FACEBOOK_ACCESS_TOKEN,
  envFilePath: path.join(__dirname, '..', '.env.local')
};

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    
    const options = {
      hostname: 'graph.facebook.com',
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          resolve({ raw: responseData });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function refreshFacebookToken() {
  console.log('🔄 Renovando token de Facebook...');

  if (!CONFIG.appSecret) {
    console.error('❌ ERROR: FACEBOOK_APP_SECRET no configurado');
    console.log('📋 Para obtenerlo:');
    console.log('1. Ve a developers.facebook.com');
    console.log('2. Selecciona tu app');
    console.log('3. Settings → Basic');  
    console.log('4. Copia el "App Secret"');
    process.exit(1);
  }

  try {
    // Paso 1: Intercambiar token de corta por larga duración
    console.log('📤 Intercambiando token de corta por larga duración...');
    
    const exchangeResult = await makeRequest('/oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: CONFIG.appId,
      client_secret: CONFIG.appSecret,
      fb_exchange_token: CONFIG.currentToken
    });

    if (exchangeResult.error) {
      console.error('❌ Error intercambiando token:', exchangeResult.error);
      process.exit(1);
    }

    const longLivedToken = exchangeResult.access_token;
    console.log('✅ Token de larga duración obtenido');

    // Paso 2: Obtener páginas disponibles
    console.log('📄 Obteniendo páginas disponibles...');
    
    const pagesResult = await makeRequest('/me/accounts', {
      access_token: longLivedToken,
      fields: 'name,access_token,id'
    });

    // Paso 3: Actualizar archivo .env.local
    console.log('💾 Actualizando configuración...');
    
    let envContent = '';
    if (fs.existsSync(CONFIG.envFilePath)) {
      envContent = fs.readFileSync(CONFIG.envFilePath, 'utf8');
    }

    // Actualizar token de usuario
    const tokenRegex = /FACEBOOK_ACCESS_TOKEN=.*/;
    const newTokenLine = `FACEBOOK_ACCESS_TOKEN=${longLivedToken}`;
    
    if (tokenRegex.test(envContent)) {
      envContent = envContent.replace(tokenRegex, newTokenLine);
    } else {
      envContent += `\n${newTokenLine}`;
    }

    // Si hay páginas, actualizar token de página
    if (pagesResult.data && pagesResult.data.length > 0) {
      const firstPage = pagesResult.data[0];
      console.log(`📄 Página encontrada: ${firstPage.name} (ID: ${firstPage.id})`);
      
      const pageTokenRegex = /FACEBOOK_PAGE_TOKEN=.*/;
      const pageIdRegex = /FACEBOOK_PAGE_ID=.*/;
      
      const newPageTokenLine = `FACEBOOK_PAGE_TOKEN=${firstPage.access_token}`;
      const newPageIdLine = `FACEBOOK_PAGE_ID=${firstPage.id}`;
      
      if (pageTokenRegex.test(envContent)) {
        envContent = envContent.replace(pageTokenRegex, newPageTokenLine);
      } else {
        envContent += `\n${newPageTokenLine}`;
      }
      
      if (pageIdRegex.test(envContent)) {
        envContent = envContent.replace(pageIdRegex, newPageIdLine);
      } else {
        envContent += `\n${newPageIdLine}`;
      }
    } else {
      console.log('⚠️ No se encontraron páginas, usando token de usuario');
    }

    // Guardar archivo
    fs.writeFileSync(CONFIG.envFilePath, envContent);
    
    console.log('🎉 Token renovado exitosamente!');
    console.log('⏰ Válido por ~60 días');
    console.log('🔄 Reinicia tu servidor: npm run dev');

  } catch (error) {
    console.error('❌ Error renovando token:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  refreshFacebookToken();
}

module.exports = { refreshFacebookToken };