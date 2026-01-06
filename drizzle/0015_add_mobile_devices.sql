-- Mobile Devices table for push notifications and mobile sessions
CREATE TABLE IF NOT EXISTS "mobile_devices" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "store_id" UUID REFERENCES "stores"("id") ON DELETE SET NULL,
    
    -- Device info
    "device_id" VARCHAR(255) NOT NULL,
    "push_token" VARCHAR(500),
    "platform" VARCHAR(20) NOT NULL, -- 'ios' or 'android'
    "app_version" VARCHAR(50),
    "os_version" VARCHAR(50),
    "device_name" VARCHAR(255),
    
    -- Session
    "session_token" VARCHAR(255) NOT NULL UNIQUE,
    "refresh_token" VARCHAR(255) UNIQUE,
    "expires_at" TIMESTAMP NOT NULL,
    
    -- Notification settings
    "notifications_enabled" BOOLEAN DEFAULT true NOT NULL,
    "notify_new_orders" BOOLEAN DEFAULT true NOT NULL,
    "notify_low_stock" BOOLEAN DEFAULT true NOT NULL,
    "notify_returns" BOOLEAN DEFAULT true NOT NULL,
    
    -- Tracking
    "last_active_at" TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_mobile_devices_user" ON "mobile_devices"("user_id");
CREATE INDEX IF NOT EXISTS "idx_mobile_devices_store" ON "mobile_devices"("store_id");
CREATE INDEX IF NOT EXISTS "idx_mobile_devices_token" ON "mobile_devices"("session_token");
CREATE INDEX IF NOT EXISTS "idx_mobile_devices_push" ON "mobile_devices"("push_token");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mobile_devices_user_device" ON "mobile_devices"("user_id", "device_id");

