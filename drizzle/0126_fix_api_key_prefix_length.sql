-- Fix API Key prefix length (qs_live_xxxx = 12 chars, was varchar(10))
ALTER TABLE "api_keys" ALTER COLUMN "key_prefix" TYPE varchar(20);

