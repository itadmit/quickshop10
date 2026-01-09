-- Add statistics field to advisor_answers table
ALTER TABLE "advisor_answers" ADD COLUMN IF NOT EXISTS "total_selections" integer DEFAULT 0 NOT NULL;

