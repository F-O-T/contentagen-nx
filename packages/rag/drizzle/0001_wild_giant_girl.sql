CREATE TYPE "public"."brand_knowledge_type" AS ENUM('feature', 'document');--> statement-breakpoint
CREATE TYPE "public"."competitor_knowledge_type" AS ENUM('feature', 'document');--> statement-breakpoint
CREATE TYPE "public"."idea_layout_type" AS ENUM('tutorial', 'interview', 'article', 'changelog');--> statement-breakpoint
CREATE TABLE "brand_knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"chunk" text NOT NULL,
	"type" "brand_knowledge_type" NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor_knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"chunk" text NOT NULL,
	"type" "competitor_knowledge_type" NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "related_slugs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ideas_rag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"layout" "idea_layout_type" NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "brandKnowledgeEmbeddingIndex" ON "brand_knowledge" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "competitorKnowledgeEmbeddingIndex" ON "competitor_knowledge" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "relatedSlugsEmbeddingIndex" ON "related_slugs" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "ideasRagEmbeddingIndex" ON "ideas_rag" USING hnsw ("embedding" vector_cosine_ops);