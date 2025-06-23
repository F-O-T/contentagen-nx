CREATE TYPE "public"."content_length" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('blog_posts', 'social_media', 'marketing_copy', 'technical_docs');--> statement-breakpoint
CREATE TYPE "public"."formatting_style" AS ENUM('structured', 'narrative', 'list_based');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."target_audience" AS ENUM('general_public', 'professionals', 'beginners', 'customers');--> statement-breakpoint
CREATE TYPE "public"."voice_tone" AS ENUM('professional', 'conversational', 'educational', 'creative');--> statement-breakpoint
CREATE TABLE "agent" (
	"content_type" "content_type" NOT NULL,
	"created_at" timestamp NOT NULL,
	"description" text,
	"formatting_style" "formatting_style" DEFAULT 'structured',
	"id" text PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_generated_at" timestamp,
	"name" text NOT NULL,
	"project_id" text,
	"seo_keywords" json DEFAULT '[]'::json,
	"target_audience" "target_audience" NOT NULL,
	"topics" json DEFAULT '[]'::json,
	"total_drafts" integer DEFAULT 0,
	"total_published" integer DEFAULT 0,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"voice_tone" "voice_tone" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"content" text NOT NULL,
	"content_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_resolved" boolean DEFAULT false,
	"parent_comment_id" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"agent_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"excerpt" text,
	"id" text PRIMARY KEY NOT NULL,
	"meta_description" text,
	"published_at" timestamp,
	"read_time_minutes" integer DEFAULT 0,
	"scheduled_at" timestamp,
	"slug" text,
	"status" "content_status" DEFAULT 'draft',
	"tags" json DEFAULT '[]'::json,
	"title" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"word_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "content_request" (
	"agent_id" text NOT NULL,
	"brief_description" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"generated_content_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"include_images" boolean DEFAULT false,
	"is_completed" boolean DEFAULT false,
	"priority" "priority" DEFAULT 'normal',
	"target_length" "content_length" DEFAULT 'medium',
	"topic" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_log" (
	"content_id" text NOT NULL,
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
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_request" ADD CONSTRAINT "content_request_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_request" ADD CONSTRAINT "content_request_generated_content_id_content_id_fk" FOREIGN KEY ("generated_content_id") REFERENCES "public"."content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_request" ADD CONSTRAINT "content_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_log" ADD CONSTRAINT "export_log_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_log" ADD CONSTRAINT "export_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;