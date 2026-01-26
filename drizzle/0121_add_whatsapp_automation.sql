-- Add send_whatsapp action type to automation_action_type enum
-- This enables WhatsApp messages via True Story API in automations

ALTER TYPE automation_action_type ADD VALUE IF NOT EXISTS 'send_whatsapp';

