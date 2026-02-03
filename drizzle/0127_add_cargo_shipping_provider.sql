-- Add 'cargo' to shipping_provider enum
ALTER TYPE "shipping_provider" ADD VALUE IF NOT EXISTS 'cargo';
