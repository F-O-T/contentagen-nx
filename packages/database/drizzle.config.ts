import type { Config } from "drizzle-kit";
import z from "zod";

const env = z
   .object({
      DATABASE_URL: z.string(),
   })
   .parse(process.env);

export default {
   schema: "./src/schema.ts",
   dialect: "postgresql",
   dbCredentials: { url: env.DATABASE_URL },
   casing: "snake_case",
} satisfies Config;
