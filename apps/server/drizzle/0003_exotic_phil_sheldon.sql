DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='agent' AND column_name='knowledge_base'
    ) THEN
        ALTER TABLE "agent" ADD COLUMN "knowledge_base" vector(1536);
    END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_knowledge_base_idx" ON "agent" USING hnsw ("knowledge_base" vector_cosine_ops);