-- Add PayPal to payment_provider enum
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'paypal';

