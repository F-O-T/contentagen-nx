DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE "public"."content_type" AS ENUM('blog_posts', 'social_media', 'marketing_copy', 'technical_docs');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voice_tone') THEN
        CREATE TYPE "public"."voice_tone" AS ENUM('professional', 'conversational', 'educational', 'creative');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_audience') THEN
        CREATE TYPE "public"."target_audience" AS ENUM('general_public', 'professionals', 'beginners', 'customers');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'formatting_style') THEN
        CREATE TYPE "public"."formatting_style" AS ENUM('structured', 'narrative', 'list_based');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE "public"."content_status" AS ENUM('draft', 'review', 'published', 'archived');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_length') THEN
        CREATE TYPE "public"."content_length" AS ENUM('short', 'medium', 'long');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority') THEN
        CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'urgent');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_request_status') THEN
        CREATE TYPE "public"."content_request_status" AS ENUM('pending', 'approved', 'rejected');
    END IF;
END $$;--> statement-breakpoint