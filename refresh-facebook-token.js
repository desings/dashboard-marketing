#!/usr/bin/env node

/**
 * HERRAMIENTA SIMPLE para renovar tokens de Facebook
 * 
 * Esto te va a dar un token que dura 60 días Y te va a mostrar 
 * cómo obtener Page Access Tokens que NUNCA caducan.
 * 
 * Uso: node refresh-facebook-token.js
 */

const https = require('https');
const readline = require('readline');

const FACEBOOK_APP_ID = '1314977153875955';
const FACEBOOK_APP_SECRET = 'a797d865b513dc152ed306d420ee581c';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔄 RENOVADOR DE TOKENS DE FACEBOOK');
  console.log('=====================================\n');
  
  console.log('📋 PASOS:');
  console.log('1. Ve a https://vmi2907616.contaboserver.net');
  console.log('2. Busca "Credentials" > "FB TOKEN"');
  console.log('3. Haz el OAuth flow NUEVAMENTE (Connect my account)');
  console.log('4. Copia el nuevo token que aparezca');
  console.log('5. Pégalo aquí\n');

  const currentToken = await question('🔑 Pega tu token actual (el nuevo de n8n): ');
  
  if (!currentToken || currentToken.length < 10) {
    console.log('❌ Token inválido');
    rl.close();
    return;
  }

  console.log('\n🔄 Paso 1: Verificando token...');
  
  // Verificar token
  try {
    const verifyUrl = `https://graph.facebook.com/me?access_token=${currentToken}&fields=id,name`;
    const verifyResult = await makeRequest(verifyUrl);
    
    if (verifyResult.error) {
      console.log('❌ Token inválido:', verifyResult.error.message);
      console.log('\n💡 SOLUCIÓN: Ve a n8n y haz el OAuth flow NUEVAMENTE');
      rl.close();
      return;
    }
    
    console.log(`✅ Token válido para: ${verifyResult.name}`);
    
  } catch (error) {
    console.log('❌ Error verificando token:', error.message);
    rl.close();
    return;
  }

  console.log('\n🔄 Paso 2: Convirtiendo a Long-Lived Token (60 días)...');
  
  // Convertir a long-lived token
  try {
    const exchangeUrl = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${currentToken}`;
    const exchangeResult = await makeRequest(exchangeUrl);
    
    if (exchangeResult.error) {
      console.log('❌ No se pudo convertir:', exchangeResult.error.message);
    } else if (exchangeResult.access_token) {
      console.log('✅ Long-lived token obtenido:');
      console.log(`🔑 ${exchangeResult.access_token}`);
      console.log(`⏰ Expira en ${exchangeResult.expires_in} segundos (${Math.round(exchangeResult.expires_in/86400)} días)`);
      
      // Obtener Page Tokens
      console.log('\n🔄 Paso 3: Obteniendo Page Access Tokens (PERMANENTES)...');
      
      const pageUrl = `https://graph.facebook.com/me/accounts?access_token=${exchangeResult.access_token}&fields=name,access_token,id`;
      const pageResult = await makeRequest(pageUrl);
      
      if (pageResult.data && pageResult.data.length > 0) {
        console.log('\n🏆 PAGE ACCESS TOKENS (NUNCA CADUCAN):');
        console.log('=====================================');
        
        pageResult.data.forEach((page, index) => {
          console.log(`\n📖 Página ${index + 1}: ${page.name}`);
          console.log(`🆔 ID: ${page.id}`);
          console.log(`🔑 TOKEN: ${page.access_token}`);
        });
        
        console.log('\n🎯 INSTRUCCIONES FINALES:');
        console.log('1. Ve a n8n: https://vmi2907616.contaboserver.net');
        console.log('2. Edita la credencial "FB TOKEN"');
        console.log(`3. Reemplaza el Access Token con el primer Page Token de arriba`);
        console.log('4. ✅ ¡Ese token NUNCA va a caducar!');
        
        if (pageResult.data.length > 0) {
          console.log('\n🔥 USA ESTE TOKEN (cópialo):');
          console.log(pageResult.data[0].access_token);
        }
        
      } else {
        console.log('⚠️ No se encontraron páginas. Usa el long-lived token:');
        console.log(exchangeResult.access_token);
      }
    }
    
  } catch (error) {
    console.log('❌ Error en intercambio:', error.message);
  }
  
  rl.close();
}

main().catch(console.error);