import { validateInput } from "@api/shared/errors";
import { type Static, Type } from "@sinclair/typebox";

const EnvSchema = Type.Object({
   BETTER_AUTH_SECRET: Type.String(),
   BETTER_AUTH_TRUSTED_ORIGINS: Type.String(),
   DATABASE_URL: Type.String(),
   RESEND_API_KEY: Type.String(),
   POLAR_ACCESS_TOKEN: Type.String(),
   POLAR_SUCCESS_URL: Type.String(),
   REDIS_URL: Type.String(),
   OPENROUTER_API_KEY: Type.String(),
   OPENAI_API_KEY: Type.String(),
});

function parseEnv(env: NodeJS.ProcessEnv): Static<typeof EnvSchema> {
   validateInput(EnvSchema, env);
   return env;
}

export const isProduction = process.env.NODE_ENV === "production";

export const env = parseEnv(process.env);
