import { serverEnv as env } from "@packages/environment/server";
import { createChromaClient } from "@packages/chroma-db/client";

export const chromaClient = createChromaClient(env.CHROMA_DB_URL);
