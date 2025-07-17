import { parseEnv } from "../src/helpers";
import { Type } from "@sinclair/typebox";
import { describe, it, expect } from "vitest";

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
});

describe("parseEnv", () => {
   const validEnv = {
      POLAR_PREMIUM_PLAN: "uuid1",
      POLAR_PRO_PLAN: "uuid2",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      BETTER_AUTH_GOOGLE_CLIENT_ID: "clientid",
      BETTER_AUTH_GOOGLE_CLIENT_SECRET: "clientsecret",
      ARCJET_KEY: "arcjetkey",
      ARCJET_ENV: "development",
      POLAR_ACCESS_TOKEN: "token",
      POLAR_SUCCESS_URL: "https://my-app.com/success?checkout_id={CHECKOUT_ID}",
      RESEND_API_KEY: "resendkey",
      BETTER_AUTH_SECRET: "secret",
      BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:3000",
      REDIS_URL: "redis://localhost:6379",
      OPENROUTER_API_KEY: "openrouterkey",
      OPENAI_API_KEY: "openaikey",
      AP_QUEUE_UI_PASSWORD: "password",
      AP_QUEUE_UI_USERNAME: "admin",
      MINIO_ENDPOINT: "localhost:9000",
      MINIO_ACCESS_KEY: "minioadmin",
      MINIO_SECRET_KEY: "minioadmin123",
      MINIO_BUCKET: "content-writer",
      TAVILY_API_KEY: "tavilykey",
   };

   it("should parse valid env", () => {
      const result = parseEnv(validEnv, EnvSchema);
      expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
      expect(result.MINIO_BUCKET).toBe("content-writer");
      expect(Object.keys(result).sort()).toEqual(
         Object.keys(EnvSchema.properties).sort(),
      );
   });

   it("should throw if a required variable is missing", () => {
      const { DATABASE_URL, ...env } = validEnv;
      expect(() => parseEnv(env as any, EnvSchema)).toThrow();
   });

   it("should throw if a required variable is empty", () => {
      const env = { ...validEnv, DATABASE_URL: "" };
      expect(() => parseEnv(env, EnvSchema)).toThrow();
   });

   it("should ignore extra variables", () => {
      const env = { ...validEnv, EXTRA_VAR: "extra" };
      const result = parseEnv(env, EnvSchema);
      expect("EXTRA_VAR" in result).toBe(false);
      expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
   });
});
