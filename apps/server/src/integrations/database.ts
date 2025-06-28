import { env } from "@api/config/env";
import * as authSchema from "@api/schemas/auth-schema";
import * as contentSchema from "@api/schemas/content-schema";
import * as waitlistSchema from "@api/schemas/waitlist-schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const client = neon(env.DATABASE_URL);

export const db = drizzle({
   client,
   schema: {
      ...authSchema,
      ...contentSchema,
      ...waitlistSchema,
   },
});
