-- =================================
-- CRM MARKETING - ESQUEMA SUPABASE
-- =================================

-- Tabla de usuarios del CRM
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  tenant_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cuentas sociales conectadas
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'facebook', 'instagram', 'google', 'pinterest'
  provider_account_id VARCHAR(255) NOT NULL, -- ID de la cuenta en el proveedor
  provider_account_name VARCHAR(255), -- Nombre/handle de la cuenta
  access_token TEXT NOT NULL,
  refresh_token TEXT, -- Para Google y Pinterest
  long_lived_token TEXT, -- Para Facebook/Instagram
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT[] NOT NULL, -- Permisos otorgados
  account_type VARCHAR(50), -- 'page', 'user', 'business', etc.
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'error', 'revoked'
  error_message TEXT, -- Último error de autenticación
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, provider, provider_account_id),
  CHECK (provider IN ('facebook', 'instagram', 'google', 'pinterest')),
  CHECK (status IN ('active', 'expired', 'error', 'revoked'))
);

-- Tabla de publicaciones programadas
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT NOT NULL,
  media_urls TEXT[], -- URLs de imágenes/videos
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled'))
);

-- Tabla de publicaciones en plataformas específicas
CREATE TABLE IF NOT EXISTS post_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform_post_id VARCHAR(255), -- ID del post en la plataforma
  platform_url VARCHAR(500), -- URL del post publicado
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'published', 'failed'
  error_message TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (status IN ('pending', 'published', 'failed'))
);

-- Tabla de configuración OAuth por tenant
CREATE TABLE IF NOT EXISTS oauth_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  client_secret TEXT NOT NULL, -- Encriptado
  redirect_uri VARCHAR(500) NOT NULL,
  scopes TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, provider),
  CHECK (provider IN ('facebook', 'instagram', 'google', 'pinterest'))
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON social_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_social_accounts_status ON social_accounts(status);
CREATE INDEX IF NOT EXISTS idx_social_accounts_expires_at ON social_accounts(expires_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_post_publications_scheduled_post_id ON post_publications(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_post_publications_social_account_id ON post_publications(social_account_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_configurations_updated_at BEFORE UPDATE ON oauth_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();