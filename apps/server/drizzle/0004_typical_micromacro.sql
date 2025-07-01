DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='agent' AND column_name='base_prompt'
    ) THEN
        ALTER TABLE "agent" ADD COLUMN "base_prompt" text;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='agent' AND column_name='seo_focus'
    ) THEN
        ALTER TABLE "agent" DROP COLUMN "seo_focus";
    END IF;
END $$;