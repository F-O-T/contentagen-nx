import { z } from "zod";
import { parseEnv } from "./helpers";

const EnvSchema = z.object({
   APP_URL: z.string().optional().default("https://app.contentta.co"),
   BETTER_STACK_HEARTBEAT_URL: z.url().optional(),
   DATABASE_URL: z.string(),
   LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .optional()
      .default("info"),
   LOGTAIL_ENDPOINT: z.url().optional(),
   LOGTAIL_SOURCE_TOKEN: z.string().optional(),
   REDIS_URL: z.string().optional().default("redis://localhost:6379"),
   RESEND_API_KEY: z.string(),
});
export type WorkerEnv = z.infer<typeof EnvSchema>;
export const workerEnv: WorkerEnv = parseEnv(process.env, EnvSchema);
