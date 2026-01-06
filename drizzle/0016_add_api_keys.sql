-- API Keys table for public developer API
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    
    -- Key info
    "name" VARCHAR(255) NOT NULL,
    "key_prefix" VARCHAR(10) NOT NULL, -- First 8 chars for identification (qs_live_xxxx)
    "key_hash" VARCHAR(255) NOT NULL, -- SHA256 hash of full key
    "last_four" VARCHAR(4) NOT NULL, -- Last 4 chars for display
    
    -- Permissions/Scopes
    "scopes" JSONB DEFAULT '[]' NOT NULL, -- ['orders:read', 'products:write', etc.]
    
    -- Rate limiting
    "rate_limit" INTEGER DEFAULT 100 NOT NULL, -- requests per minute
    
    -- Status
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "expires_at" TIMESTAMP,
    
    -- Usage tracking
    "last_used_at" TIMESTAMP,
    "total_requests" INTEGER DEFAULT 0 NOT NULL,
    
    -- Metadata
    "description" TEXT,
    "allowed_ips" JSONB, -- Optional IP whitelist
    "allowed_origins" JSONB, -- Optional CORS origins
    
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_api_keys_store" ON "api_keys"("store_id");
CREATE INDEX IF NOT EXISTS "idx_api_keys_hash" ON "api_keys"("key_hash");
CREATE INDEX IF NOT EXISTS "idx_api_keys_prefix" ON "api_keys"("key_prefix");

-- API Key Usage Logs (for analytics and debugging)
CREATE TABLE IF NOT EXISTS "api_key_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "api_key_id" UUID NOT NULL REFERENCES "api_keys"("id") ON DELETE CASCADE,
    "store_id" UUID NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    
    -- Request info
    "method" VARCHAR(10) NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time_ms" INTEGER,
    
    -- Client info
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    
    -- Error tracking
    "error_message" TEXT,
    
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for logs
CREATE INDEX IF NOT EXISTS "idx_api_key_logs_key" ON "api_key_logs"("api_key_id");
CREATE INDEX IF NOT EXISTS "idx_api_key_logs_store" ON "api_key_logs"("store_id");
CREATE INDEX IF NOT EXISTS "idx_api_key_logs_created" ON "api_key_logs"("created_at");

-- Partition logs by month for performance (optional, can be done later)
-- CREATE INDEX IF NOT EXISTS "idx_api_key_logs_created_month" ON "api_key_logs"(date_trunc('month', created_at));

