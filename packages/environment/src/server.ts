import { Type } from "@sinclair/typebox";
import { parseEnv } from "./helpers";
import type { Static } from "@sinclair/typebox";

const EnvSchema = Type.Object({
   POLAR_PREMIUM_PLAN: Type.String(),
   POLAR_PRO_PLAN: Type.String(),
   DATABASE_URL: Type.String(),
   BETTER_AUTH_GOOGLE_CLIENT_ID: Type.String(),
   BETTER_AUTH_GOOGLE_CLIENT_SECRET: Type.String(),
   ARCJET_KEY: Type.String(),
   ARCJET_ENV: Type.Optional(Type.String()),
   POLAR_ACCESS_TOKEN: Type.String(),
   POLAR_SUCCESS_URL: Type.String(),
   RESEND_API_KEY: Type.String(),
   BETTER_AUTH_SECRET: Type.String(),
   BETTER_AUTH_TRUSTED_ORIGINS: Type.String(),
   REDIS_URL: Type.String(),
   OPENROUTER_API_KEY: Type.String(),
   OPENAI_API_KEY: Type.String(),
   AP_QUEUE_UI_PASSWORD: Type.String(),
   AP_QUEUE_UI_USERNAME: Type.String(),
   MINIO_ENDPOINT: Type.String(),
   MINIO_ACCESS_KEY: Type.String(),
   MINIO_SECRET_KEY: Type.String(),
   MINIO_BUCKET: Type.String({ default: "content-writer" }),
   TAVILY_API_KEY: Type.String(),
   CHROMA_DB_URL: Type.String(),
});
export type ServerEnv = Static<typeof EnvSchema>;
export const serverEnv: ServerEnv = parseEnv(process.env, EnvSchema);
