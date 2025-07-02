DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'internal_link_format') THEN
        CREATE TYPE "public"."internal_link_format" AS ENUM('mdx', 'html');
    END IF;
END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS "content_request_embedding_idx";
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='content_request' AND column_name='internal_link_format'
    ) THEN
        ALTER TABLE "content_request" ADD COLUMN "internal_link_format" "internal_link_format" DEFAULT 'mdx';
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='content_request' AND column_name='include_meta_tags'
    ) THEN
        ALTER TABLE "content_request" ADD COLUMN "include_meta_tags" boolean DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='content_request' AND column_name='include_meta_description'
    ) THEN
        ALTER TABLE "content_request" ADD COLUMN "include_meta_description" boolean DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='content_request' AND column_name='approved'
    ) THEN
        ALTER TABLE "content_request" ADD COLUMN "approved" boolean DEFAULT true;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='content' AND column_name='published_at'
    ) THEN
        ALTER TABLE "content" DROP COLUMN "published_at";
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='content' AND column_name='scheduled_at'
    ) THEN
        ALTER TABLE "content" DROP COLUMN "scheduled_at";
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='content_request' AND column_name='embedding'
    ) THEN
        ALTER TABLE "content_request" DROP COLUMN "embedding";
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='content_request' AND column_name='status'
    ) THEN
        ALTER TABLE "content_request" DROP COLUMN "status";
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_request_status') THEN
        DROP TYPE "public"."content_request_status";
    END IF;
END $$;