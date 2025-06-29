ALTER TABLE "content_request" DROP CONSTRAINT "content_request_generated_content_id_content_id_fk";
--> statement-breakpoint
ALTER TABLE "content_request" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "content_request" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "content_request" ADD CONSTRAINT "content_request_generated_content_id_content_id_fk" FOREIGN KEY ("generated_content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" DROP COLUMN "base_prompt";--> statement-breakpoint
ALTER TABLE "agent" DROP COLUMN "example_article";--> statement-breakpoint
ALTER TABLE "content" DROP COLUMN "excerpt";--> statement-breakpoint
ALTER TABLE "content" DROP COLUMN "meta_description";--> statement-breakpoint
ALTER TABLE "content_request" DROP COLUMN "include_images";--> statement-breakpoint
ALTER TABLE "content_request" DROP COLUMN "priority";