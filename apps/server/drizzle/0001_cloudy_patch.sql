DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_length') THEN
        CREATE TYPE "public"."content_length" AS ENUM('short', 'medium', 'long');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_request_status') THEN
        CREATE TYPE "public"."content_request_status" AS ENUM('pending', 'approved', 'rejected');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE "public"."content_status" AS ENUM('draft', 'review', 'published', 'archived');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE "public"."content_type" AS ENUM('blog_posts', 'social_media', 'marketing_copy', 'technical_docs');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'formatting_style') THEN
        CREATE TYPE "public"."formatting_style" AS ENUM('structured', 'narrative', 'list_based');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority') THEN
        CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'urgent');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_audience') THEN
        CREATE TYPE "public"."target_audience" AS ENUM('general_public', 'professionals', 'beginners', 'customers');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voice_tone') THEN
        CREATE TYPE "public"."voice_tone" AS ENUM('professional', 'conversational', 'educational', 'creative');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_type') THEN
        CREATE TYPE "public"."lead_type" AS ENUM('individual blogger', 'marketing team', 'freelance writer', 'business owner', 'other');
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"created_at" timestamp NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent" (
	"content_type" "content_type" NOT NULL,
	"created_at" timestamp NOT NULL,
	"description" text,
	"formatting_style" "formatting_style" DEFAULT 'structured',
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_generated_at" timestamp,
	"name" text NOT NULL,
	"project_id" uuid,
	"seo_focus" boolean DEFAULT false,
	"target_audience" "target_audience" NOT NULL,
	"total_drafts" integer DEFAULT 0,
	"total_published" integer DEFAULT 0,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"voice_tone" "voice_tone" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"content" text NOT NULL,
	"content_id" uuid NOT NULL,
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_resolved" boolean DEFAULT false,
	"parent_comment_id" uuid,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"agent_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"published_at" timestamp,
	"read_time_minutes" integer DEFAULT 0,
	"scheduled_at" timestamp,
	"slug" text,
	"status" "content_status" DEFAULT 'draft',
	"tags" json,
	"title" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"words_count" integer,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "content_request" (
	"agent_id" uuid NOT NULL,
	"brief_description" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"embedding" vector(1536),
	"generated_content_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_completed" boolean DEFAULT false,
	"status" "content_request_status" DEFAULT 'pending' NOT NULL,
	"target_length" "content_length" DEFAULT 'medium' NOT NULL,
	"topic" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_log" (
	"content_id" uuid NOT NULL,
	"created_at" timestamp NOT NULL,
	"filename" text NOT NULL,
	"format" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"options" json DEFAULT '{}'::json,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"created_at" timestamp NOT NULL,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_type" "lead_type" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_request" ADD CONSTRAINT "content_request_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_request" ADD CONSTRAINT "content_request_generated_content_id_content_id_fk" FOREIGN KEY ("generated_content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_request" ADD CONSTRAINT "content_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_log" ADD CONSTRAINT "export_log_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_log" ADD CONSTRAINT "export_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_embedding_idx" ON "content" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "content_request_embedding_idx" ON "content_request" USING hnsw ("embedding" vector_cosine_ops);
