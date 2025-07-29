import { serverEnv as env } from "@packages/environment/server";
import { createChromaClient } from "@packages/chroma-db/client";
import { createOpenrouterClient } from "@packages/openrouter/client";

export const chromaClient = createChromaClient(env.CHROMA_DB_URL);
export const openRouterClient = createOpenrouterClient(env.OPENROUTER_API_KEY);
