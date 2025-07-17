import { env } from "@api/config/env";
import { createChromaClient } from "@packages/chroma-db/client";

export const chromaClient = createChromaClient(env.CHROMA_DB_URL);
