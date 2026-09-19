-- ==============================================================================
-- Juba News Relational Database Schema (PostgreSQL Compatible)
-- Supports: Neon, Supabase, Railway, Render, or any standard PostgreSQL instance.
-- No Firebase dependencies. Direct relational schema with duplicate protection.
-- ==============================================================================

-- 1. Users & Administrators Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'USER', -- SUPER_ADMIN, EDITOR, AUTHOR, MODERATOR, MEDIA_MANAGER, USER
    password_hash VARCHAR(255),
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    totp_secret VARCHAR(128),
    avatar_url TEXT,
    bio TEXT,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(128) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    subtitle_en TEXT,
    subtitle_ar TEXT,
    content_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    featured_image TEXT NOT NULL,
    image_caption_en TEXT,
    image_caption_ar TEXT,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(128),
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'draft', -- draft, needs_review, approved, published, rejected, archived
    is_breaking BOOLEAN DEFAULT FALSE,
    is_top_headline BOOLEAN DEFAULT FALSE,
    is_editors_pick BOOLEAN DEFAULT FALSE,
    reading_time_minutes INT DEFAULT 3,
    views INT DEFAULT 0,
    
    -- Facebook & External Source metadata
    source VARCHAR(64) DEFAULT 'Editorial Desk',
    source_url TEXT,
    facebook_post_id VARCHAR(128),
    facebook_url TEXT,
    
    -- SEO & Social Open Graph metadata
    seo_title TEXT,
    seo_description TEXT,
    og_image TEXT,
    canonical_url TEXT,
    
    -- Extracted Entities & Location
    location VARCHAR(255),
    people JSONB DEFAULT '[]'::jsonb,
    organizations JSONB DEFAULT '[]'::jsonb,
    
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Facebook Posts Table (Crucial for Meta Integration & Duplicate Prevention)
CREATE TABLE IF NOT EXISTS facebook_posts (
    id VARCHAR(64) PRIMARY KEY,
    facebook_post_id VARCHAR(128) UNIQUE NOT NULL, -- UNIQUE constraint strictly prevents duplicate imports
    page_id VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    facebook_url TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(64) DEFAULT 'photo', -- photo, video, album, link, status
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_payload JSONB NOT NULL,
    processing_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, ai_processing, processed, failed, skipped
    article_id VARCHAR(64) REFERENCES articles(id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Article Media Table
CREATE TABLE IF NOT EXISTS article_media (
    id VARCHAR(64) PRIMARY KEY,
    article_id VARCHAR(64) REFERENCES articles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(32) NOT NULL, -- image, video, audio
    caption TEXT,
    credit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(128) UNIQUE NOT NULL,
    name_ar VARCHAR(128) NOT NULL,
    name_en VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Article Tags Many-to-Many Table
CREATE TABLE IF NOT EXISTS article_tags (
    article_id VARCHAR(64) REFERENCES articles(id) ON DELETE CASCADE,
    tag_id VARCHAR(64) REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- 8. Synchronization Logs Table
CREATE TABLE IF NOT EXISTS sync_logs (
    id VARCHAR(64) PRIMARY KEY,
    source VARCHAR(32) NOT NULL, -- WEBHOOK, MANUAL
    status VARCHAR(32) NOT NULL, -- SUCCESS, PARTIAL, FAILED
    imported_count INT DEFAULT 0,
    skipped_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    message TEXT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. AI Jobs Table
CREATE TABLE IF NOT EXISTS ai_jobs (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) REFERENCES facebook_posts(id) ON DELETE CASCADE,
    article_id VARCHAR(64) REFERENCES articles(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
    model VARCHAR(64) NOT NULL,
    duration_ms INT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 10. Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
    id VARCHAR(64) PRIMARY KEY,
    site_name_en VARCHAR(255) NOT NULL,
    site_name_ar VARCHAR(255) NOT NULL,
    facebook_integration VARCHAR(32) DEFAULT 'CONNECTED', -- CONNECTED, DISCONNECTED
    sync_mode VARCHAR(32) DEFAULT 'BOTH', -- WEBHOOK, MANUAL, BOTH
    ai_processing VARCHAR(32) DEFAULT 'ENABLED', -- ENABLED, DISABLED
    auto_publish BOOLEAN DEFAULT FALSE, -- Default is FALSE: Drafts require editorial approval
    default_category VARCHAR(64) DEFAULT 'cat-ss',
    ai_language VARCHAR(32) DEFAULT 'both', -- ar, en, both
    article_style VARCHAR(32) DEFAULT 'formal', -- formal, concise, detailed
    minimum_confidence NUMERIC(3, 2) DEFAULT 0.85,
    meta_page_id VARCHAR(128),
    meta_page_name VARCHAR(255) DEFAULT 'Juba News - جوبا نيوز',
    page_permalink TEXT DEFAULT 'https://www.facebook.com/share/1UpeZiXU5k/',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_posts_post_id ON facebook_posts(facebook_post_id);
CREATE INDEX IF NOT EXISTS idx_fb_posts_status ON facebook_posts(processing_status);
