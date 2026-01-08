-- Script para configurar base de datos PostgreSQL con todas las tablas necesarias
-- Este script se puede ejecutar en Supabase o cualquier instancia PostgreSQL

-- Drop existing tables if they exist (cuidado en producción)
DROP TABLE IF EXISTS "_prisma_migrations";
DROP TABLE IF EXISTS "JobOffer";
DROP TABLE IF EXISTS "JobSearch"; 
DROP TABLE IF EXISTS "AnalyticsSnapshot";
DROP TABLE IF EXISTS "ScheduledPost";
DROP TABLE IF EXISTS "SocialAccount";
DROP TABLE IF EXISTS "UserTenant";
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "Tenant";

-- Drop enum types if they exist
DROP TYPE IF EXISTS "JobStatus";
DROP TYPE IF EXISTS "SocialPlatform";
DROP TYPE IF EXISTS "PostStatus";

-- Recreate enum types
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPLIED', 'REJECTED');
CREATE TYPE "SocialPlatform" AS ENUM ('facebook', 'linkedin', 'twitter', 'instagram', 'youtube', 'tiktok', 'pinterest', 'google_business');
CREATE TYPE "PostStatus" AS ENUM ('draft', 'scheduled', 'published', 'failed');

-- Create tables
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserTenant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "UserTenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "username" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "platforms" "SocialPlatform"[],
    "publishAt" TIMESTAMP(3) NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'scheduled',
    "tenantId" TEXT NOT NULL,
    "socialAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "data" JSONB NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- Create Job Search tables
CREATE TABLE "JobSearch" (
    "id" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "portals" TEXT[],
    "frequencyMinutes" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSearch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "location" TEXT,
    "salary" TEXT,
    "portal" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "jobSearchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserTenant_userId_tenantId_key" ON "UserTenant"("userId", "tenantId");
CREATE UNIQUE INDEX "JobOffer_url_key" ON "JobOffer"("url");

-- Add foreign key constraints
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobSearch" ADD CONSTRAINT "JobSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_jobSearchId_fkey" FOREIGN KEY ("jobSearchId") REFERENCES "JobSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert demo data
INSERT INTO "User" ("id", "email", "passwordHash") VALUES 
('demo-user', 'demo@example.com', '$2b$10$dummy.hash.for.demo');

INSERT INTO "Tenant" ("id", "name") VALUES 
('demo-tenant', 'Cliente Demo');

INSERT INTO "UserTenant" ("id", "userId", "tenantId", "role") VALUES 
('demo-relation', 'demo-user', 'demo-tenant', 'owner');