import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { PgVector } from "@mastra/pg";
import { env as serverEnv } from "@packages/environment/server";

// Language instruction for Brazilian Portuguese
export const LANGUAGE_INSTRUCTION = `
## IDIOMA DE SAIDA
Sempre responda e escreva conteudo em Portugues Brasileiro (pt-BR).
`;

// Embedding model via OpenRouter (centralized billing)
export const embeddingModel = new ModelRouterEmbeddingModel({
   providerId: "openrouter",
   modelId: "openai/text-embedding-3-small",
   url: "https://openrouter.ai/api/v1",
   apiKey: serverEnv.OPENROUTER_API_KEY,
});

// Create PgVector store if configured
const createPgVectorStore = (): PgVector | null => {
   if (!serverEnv.PG_VECTOR_URL) return null;

   return new PgVector({
      id: "mastra-rag",
      connectionString: serverEnv.PG_VECTOR_URL,
   });
};

// PgVector store for RAG and memory
export const pgVectorStore = createPgVectorStore();
