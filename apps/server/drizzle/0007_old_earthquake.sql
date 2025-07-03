CREATE TABLE "knowledge_chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"category" text,
	"keywords" json,
	"source" text,
	"source_type" text,
	"source_identifier" text,
	"embedding" vector(1536),
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
DROP INDEX "agent_knowledge_base_idx";--> statement-breakpoint
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_chunk_agent_id_idx" ON "knowledge_chunk" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunk_embedding_idx" ON "knowledge_chunk" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "agent_user_id_idx" ON "agent" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "agent" DROP COLUMN "knowledge_base";