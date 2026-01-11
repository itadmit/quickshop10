-- Add out-of-stock display settings to categories table
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "hide_out_of_stock" boolean DEFAULT false NOT NULL;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "move_out_of_stock_to_bottom" boolean DEFAULT true NOT NULL;
