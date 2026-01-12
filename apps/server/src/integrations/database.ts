import { createDb } from "@packages/database/client";
import { serverEnv as env } from "@packages/environment/server";

export const db = createDb({
   databaseUrl: env.DATABASE_URL,
});

// RAG is now handled by @packages/agents/mastra/rag
