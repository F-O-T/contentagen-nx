import { env } from "@api/config/env";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
   dbCredentials: {
      url: env.DATABASE_URL,
   },
   dialect: "postgresql",
   out: "./drizzle",
   schema: "./src/schemas/*",
});
