import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { Config } from "drizzle-kit";

const envSchema = Type.Object({
  DATABASE_URL: Type.String({ minLength: 1 }),
});

const env = Value.Parse(envSchema, process.env);

export default {
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
  casing: "snake_case",
} satisfies Config;
