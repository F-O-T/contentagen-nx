import { PgVector } from "@mastra/pg";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { serverEnv } from "@packages/environment/server";

// Language instruction for Brazilian Portuguese
export const LANGUAGE_INSTRUCTION = `
## IDIOMA DE SAIDA
Sempre responda e escreva conteudo em Portugues Brasileiro (pt-BR).
`;

// Available models (unified from both agents)
export const MODELS = {
   "anthropic/claude-haiku-4.5": "anthropic/claude-3-5-haiku-20241022",
   "mistralai/mistral-small-creative":
      "mistralai/mistral-small-3.1-24b-instruct",
} as const;

export type ModelId = keyof typeof MODELS;

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
