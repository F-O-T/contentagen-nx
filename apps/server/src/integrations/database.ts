import { createDb } from "@packages/database/client";

import { serverEnv as env } from "@packages/environment/server";
import { createPgVector } from "@packages/rag/client";
export const ragClient = createPgVector({
   pgVectorURL: env.PG_VECTOR_URL,
});
export const db = createDb({
   databaseUrl: env.DATABASE_URL,
});
