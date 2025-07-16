import { createDb } from "@packages/database/client";

import { env } from "@api/config/env";
export const db = createDb({
   databaseUrl: env.DATABASE_URL,
});
