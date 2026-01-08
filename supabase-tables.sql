-- SCRIPT PARA CREAR TABLAS EN SUPABASE
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- Crear tabla de búsquedas de trabajo
CREATE TABLE IF NOT EXISTS job_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    keywords VARCHAR(500) NOT NULL,
    portals TEXT[] DEFAULT ARRAY['infojobs'],
    frequency_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de ofertas de trabajo
CREATE TABLE IF NOT EXISTS job_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_search_id UUID REFERENCES job_searches(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255),
    location VARCHAR(255),
    salary VARCHAR(255),
    description TEXT,
    url VARCHAR(1000),
    portal VARCHAR(50) DEFAULT 'infojobs',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_id, portal)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_job_searches_user_id ON job_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_searches_is_active ON job_searches(is_active);
CREATE INDEX IF NOT EXISTS idx_job_offers_job_search_id ON job_offers(job_search_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_status ON job_offers(status);
CREATE INDEX IF NOT EXISTS idx_job_offers_created_at ON job_offers(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_job_searches_updated_at 
    BEFORE UPDATE ON job_searches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_offers_updated_at 
    BEFORE UPDATE ON job_offers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo por ahora - ajustar según necesidades)
CREATE POLICY "Allow all operations on job_searches" ON job_searches
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on job_offers" ON job_offers
    FOR ALL USING (true) WITH CHECK (true);