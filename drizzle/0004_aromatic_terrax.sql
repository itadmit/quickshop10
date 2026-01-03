CREATE TABLE "advisor_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_text" text NOT NULL,
	"answer_subtitle" text,
	"image_url" text,
	"icon" varchar(50),
	"emoji" varchar(10),
	"color" varchar(20),
	"value" varchar(100),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_product_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"answer_weights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"base_score" integer DEFAULT 0 NOT NULL,
	"bonus_rules" jsonb,
	"exclude_if_answers" jsonb DEFAULT '[]'::jsonb,
	"priority_boost" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_subtitle" text,
	"image_url" text,
	"question_type" varchar(20) DEFAULT 'single' NOT NULL,
	"answers_layout" varchar(20) DEFAULT 'grid' NOT NULL,
	"columns" integer DEFAULT 2 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"min_selections" integer DEFAULT 1 NOT NULL,
	"max_selections" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"subtitle" text,
	"image_url" text,
	"icon" varchar(50),
	"is_active" boolean DEFAULT false NOT NULL,
	"show_progress_bar" boolean DEFAULT true NOT NULL,
	"show_question_numbers" boolean DEFAULT true NOT NULL,
	"allow_back_navigation" boolean DEFAULT true NOT NULL,
	"results_count" integer DEFAULT 3 NOT NULL,
	"primary_color" varchar(20) DEFAULT '#6366f1' NOT NULL,
	"background_color" varchar(20) DEFAULT '#ffffff' NOT NULL,
	"button_style" varchar(20) DEFAULT 'rounded' NOT NULL,
	"start_button_text" varchar(100) DEFAULT 'בואו נתחיל!' NOT NULL,
	"results_title" varchar(255) DEFAULT 'המלצות עבורך' NOT NULL,
	"results_subtitle" text,
	"show_floating_button" boolean DEFAULT true NOT NULL,
	"total_starts" integer DEFAULT 0 NOT NULL,
	"total_completions" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"customer_id" uuid,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_products" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"is_completed" boolean DEFAULT false NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"converted_to_cart" boolean DEFAULT false NOT NULL,
	"converted_to_order" boolean DEFAULT false NOT NULL,
	"order_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advisor_answers" ADD CONSTRAINT "advisor_answers_question_id_advisor_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."advisor_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_product_rules" ADD CONSTRAINT "advisor_product_rules_quiz_id_advisor_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."advisor_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_product_rules" ADD CONSTRAINT "advisor_product_rules_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_questions" ADD CONSTRAINT "advisor_questions_quiz_id_advisor_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."advisor_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_quizzes" ADD CONSTRAINT "advisor_quizzes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_sessions" ADD CONSTRAINT "advisor_sessions_quiz_id_advisor_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."advisor_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_sessions" ADD CONSTRAINT "advisor_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_sessions" ADD CONSTRAINT "advisor_sessions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "advisor_answer_question_position_idx" ON "advisor_answers" USING btree ("question_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "advisor_rule_quiz_product_idx" ON "advisor_product_rules" USING btree ("quiz_id","product_id");--> statement-breakpoint
CREATE INDEX "advisor_question_quiz_position_idx" ON "advisor_questions" USING btree ("quiz_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "advisor_quiz_store_slug_idx" ON "advisor_quizzes" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "advisor_quiz_store_active_idx" ON "advisor_quizzes" USING btree ("store_id","is_active");--> statement-breakpoint
CREATE INDEX "advisor_session_quiz_idx" ON "advisor_sessions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "advisor_session_session_idx" ON "advisor_sessions" USING btree ("session_id");