import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
   server: {
      // Database (Required)
      DATABASE_URL: z.string().url(),
      PG_VECTOR_URL: z.string().url().optional(),
      REDIS_URL: z.string().url().optional().default("redis://localhost:6379"),

      // Better Auth (Required core, optional providers)
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_TRUSTED_ORIGINS: z.string(),
      BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
      BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),

      // Stripe (Optional - only if using subscription features)
      STRIPE_SECRET_KEY: z.string().optional(),
      STRIPE_WEBHOOK_SECRET: z.string().optional(),
      STRIPE_PRO_PRICE_ID: z.string().optional(),
      STRIPE_PRO_ANNUAL_PRICE_ID: z.string().optional(),
      STRIPE_LITE_PRICE_ID: z.string().optional(),
      STRIPE_LITE_ANNUAL_PRICE_ID: z.string().optional(),

      // PostHog (Required for analytics)
      POSTHOG_HOST: z.string().url(),
      POSTHOG_KEY: z.string(),
      POSTHOG_PUBLIC_KEY: z.string().optional(), // Client-side project API key (safe to expose in tracking scripts)
      POSTHOG_PROJECT_ID: z.string(),
      POSTHOG_PERSONAL_API_KEY: z.string(),

      // Email (Optional - only if using transactional emails)
      RESEND_API_KEY: z.string().optional(),

      // MinIO (Required for file storage)
      MINIO_ENDPOINT: z.string(),
      MINIO_ACCESS_KEY: z.string().optional(),
      MINIO_SECRET_KEY: z.string().optional(),
      MINIO_BUCKET: z.string().optional().default("contentta"),

      // AI Services (Optional)
      OPENROUTER_API_KEY: z.string().optional(),
      TAVILY_API_KEYS: z.string().optional(), // Multiple keys: key1,key2,key3
      EXA_API_KEYS: z.string().optional(),
      FIRECRAWL_API_KEYS: z.string().optional(),

      // Security (Optional - Arcjet for rate limiting)
      ARCJET_KEY: z.string().optional(),
      ARCJET_ENV: z.enum(["development", "production"]).optional(),

      // General
      NODE_ENV: z
         .enum(["development", "production", "test"])
         .optional()
         .default("development"),
      APP_URL: z.string().url().optional(),
      SERVER_URL: z.string().url().optional(),
      LOG_LEVEL: z
         .enum(["trace", "debug", "info", "warn", "error", "fatal"])
         .optional()
         .default("info"),
      LOGTAIL_ENDPOINT: z.string().url().optional(),
      LOGTAIL_SOURCE_TOKEN: z.string().optional(),

      // Worker
      WORKER_CONCURRENCY: z.coerce.number().optional().default(5),
      BETTER_STACK_HEARTBEAT_URL: z.string().url().optional(),
   },

   runtimeEnv: process.env,
   emptyStringAsUndefined: true,
});

export type ServerEnv = typeof env;
