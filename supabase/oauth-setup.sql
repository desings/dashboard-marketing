-- =============================================
-- CONFIGURACIÓN INICIAL OAUTH PARA SUPABASE
-- =============================================
-- Ejecutar este script después de crear el esquema principal

-- Insertar configuraciones OAuth por defecto
-- IMPORTANTE: Cambiar los valores CLIENT_ID y CLIENT_SECRET por los reales

-- 1. Facebook
INSERT INTO oauth_configurations (
  tenant_id, 
  provider, 
  client_id, 
  client_secret, 
  redirect_uri, 
  scopes,
  is_active
) VALUES (
  'default',
  'facebook',
  'TU_FACEBOOK_CLIENT_ID',  -- Cambiar por real
  'TU_FACEBOOK_CLIENT_SECRET',  -- Cambiar por real
  CONCAT(current_setting('app.settings.base_url', true), '/api/oauth/facebook/callback'),
  ARRAY[
    'pages_manage_posts',
    'pages_read_engagement', 
    'pages_show_list',
    'business_management'
  ],
  true
) ON CONFLICT (tenant_id, provider) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri,
  scopes = EXCLUDED.scopes,
  updated_at = NOW();

-- 2. Instagram  
INSERT INTO oauth_configurations (
  tenant_id,
  provider,
  client_id,
  client_secret,
  redirect_uri,
  scopes,
  is_active
) VALUES (
  'default',
  'instagram', 
  'TU_FACEBOOK_CLIENT_ID',  -- Instagram usa las mismas credenciales de Facebook
  'TU_FACEBOOK_CLIENT_SECRET',
  CONCAT(current_setting('app.settings.base_url', true), '/api/oauth/instagram/callback'),
  ARRAY[
    'instagram_basic',
    'instagram_content_publish', 
    'pages_read_engagement',
    'pages_show_list'
  ],
  true
) ON CONFLICT (tenant_id, provider) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri,
  scopes = EXCLUDED.scopes,
  updated_at = NOW();

-- 3. Google
INSERT INTO oauth_configurations (
  tenant_id,
  provider, 
  client_id,
  client_secret,
  redirect_uri,
  scopes,
  is_active
) VALUES (
  'default',
  'google',
  'TU_GOOGLE_CLIENT_ID',  -- Cambiar por real
  'TU_GOOGLE_CLIENT_SECRET',  -- Cambiar por real
  CONCAT(current_setting('app.settings.base_url', true), '/api/oauth/google/callback'),
  ARRAY[
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/business.manage'
  ],
  true
) ON CONFLICT (tenant_id, provider) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri,
  scopes = EXCLUDED.scopes,
  updated_at = NOW();

-- 4. Pinterest
INSERT INTO oauth_configurations (
  tenant_id,
  provider,
  client_id, 
  client_secret,
  redirect_uri,
  scopes,
  is_active
) VALUES (
  'default',
  'pinterest',
  'TU_PINTEREST_CLIENT_ID',  -- Cambiar por real
  'TU_PINTEREST_CLIENT_SECRET',  -- Cambiar por real  
  CONCAT(current_setting('app.settings.base_url', true), '/api/oauth/pinterest/callback'),
  ARRAY[
    'user_accounts:read',
    'pins:read',
    'pins:write',
    'boards:read',
    'boards:write'
  ],
  true
) ON CONFLICT (tenant_id, provider) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri,
  scopes = EXCLUDED.scopes,
  updated_at = NOW();

-- Configurar la variable de configuración base_url
-- IMPORTANTE: Cambiar por tu URL real de producción
ALTER DATABASE postgres SET app.settings.base_url = 'https://tu-dominio.vercel.app';

-- Verificar configuraciones insertadas
SELECT 
  provider,
  client_id,
  redirect_uri,
  array_to_string(scopes, ', ') as scopes_str,
  is_active,
  created_at
FROM oauth_configurations 
WHERE tenant_id = 'default'
ORDER BY provider;