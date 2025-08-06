import { createDb } from "@packages/database/client";

import { serverEnv as env } from "@packages/environment/server";
export const db = createDb({
   databaseUrl: env.DATABASE_URL,
});
