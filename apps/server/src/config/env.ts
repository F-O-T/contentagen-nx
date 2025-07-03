import { validateInput } from "@api/shared/errors";
import { type Static, Type } from "@sinclair/typebox";

const EnvSchema = Type.Object({
   BETTER_AUTH_SECRET: Type.String(),
   BETTER_AUTH_TRUSTED_ORIGINS: Type.String(),
   DATABASE_URL: Type.String(),
   RESEND_API_KEY: Type.String(),
   POLAR_ACCESS_TOKEN: Type.String(),
   POLAR_SUCCESS_URL: Type.String(),
   POLAR_FREE_PLAN: Type.String(),
   POLAR_PREMIUM_PLAN: Type.String(),
   POLAR_PRO_PLAN: Type.String(),
   REDIS_URL: Type.String(),
   OPENROUTER_API_KEY: Type.String(),
   OPENAI_API_KEY: Type.String(),
   AP_QUEUE_UI_PASSWORD: Type.String(),
   AP_QUEUE_UI_USERNAME: Type.String(),
   MINIO_ENDPOINT: Type.String(),
   MINIO_ACCESS_KEY: Type.String(),
   MINIO_SECRET_KEY: Type.String(),
   MINIO_BUCKET: Type.String(),
});

function parseEnv(env: NodeJS.ProcessEnv): Static<typeof EnvSchema> {
   validateInput(EnvSchema, env);
   return env;
}

export const isProduction = process.env.NODE_ENV === "production";

export const env = parseEnv(process.env);
