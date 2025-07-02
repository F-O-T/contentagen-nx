DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='agent' AND column_name='base_prompt' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "agent" ALTER COLUMN "base_prompt" DROP NOT NULL;
    END IF;
END $$;