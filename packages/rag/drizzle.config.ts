import type { Config } from "drizzle-kit";
import z from "zod";
const env = z
   .object({
      PG_VECTOR_URL: z.string(),
   })
   .parse(process.env);
export default {
   schema: "./src/schema.ts",
   dialect: "postgresql",
   dbCredentials: { url: env.PG_VECTOR_URL },
   casing: "snake_case",
} satisfies Config;
