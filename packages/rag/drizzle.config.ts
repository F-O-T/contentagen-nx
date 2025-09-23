import type { Config } from "drizzle-kit";
import { serverEnv } from "@packages/environment/server";
export default {
   schema: "./src/schema.ts",
   dialect: "postgresql",
   dbCredentials: { url: serverEnv.PG_VECTOR_URL },
   casing: "snake_case",
} satisfies Config;
