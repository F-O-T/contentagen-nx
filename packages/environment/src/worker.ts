import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
   server: {
      // Database (Required)
      DATABASE_URL: z.string().url(),
      REDIS_URL: z.string().url().optional().default("redis://localhost:6379"),

      // Email (Optional - worker can run without it)
      RESEND_API_KEY: z.string().optional(),

      // General
      APP_URL: z.string().url().optional().default("https://app.contentta.co"),
      LOG_LEVEL: z
         .enum(["trace", "debug", "info", "warn", "error", "fatal"])
         .optional()
         .default("info"),
      LOGTAIL_ENDPOINT: z.string().url().optional(),
      LOGTAIL_SOURCE_TOKEN: z.string().optional(),
      BETTER_STACK_HEARTBEAT_URL: z.string().url().optional(),
   },

   runtimeEnv: process.env,
   emptyStringAsUndefined: true,
});

export type WorkerEnv = typeof env;
