ALTER TABLE "agent" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "agent" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "agent" ALTER COLUMN "project_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "content_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "parent_comment_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "content" ALTER COLUMN "agent_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "content" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "content" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "content_request" ALTER COLUMN "agent_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "content_request" ALTER COLUMN "generated_content_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_log" ALTER COLUMN "content_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "waitlist" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "waitlist" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN "base_prompt" text;--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN "example_article" text;--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN "seo_focus" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN "word_count" integer DEFAULT 1000;