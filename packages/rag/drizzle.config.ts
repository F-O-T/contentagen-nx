import { z } from "zod";
import type { Config } from "drizzle-kit";

const envSchema = z.object({
   PG_VECTOR_URL: z.string().min(1),
});

const env = envSchema.parse(process.env);
export default {
   schema: "./src/schema.ts",
   dialect: "postgresql",
   dbCredentials: { url: env.PG_VECTOR_URL },
   casing: "snake_case",
} satisfies Config;
