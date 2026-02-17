import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { PgVector } from "@mastra/pg";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { env as serverEnv } from "@packages/environment/server";

export const pgVectorStore = new PgVector({
   id: "mastra-rag",
   connectionString: serverEnv.PG_VECTOR_URL,
   max: 10,
   idleTimeoutMillis: 30_000,
   pgPoolOptions: {
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
   },
});

/**
 * Gracefully close the PgVector connection pool.
 * Call this on process shutdown (SIGTERM / SIGINT).
 */
export async function disconnectVectorStore(): Promise<void> {
   await pgVectorStore.disconnect();
}

export const embeddingModel = new ModelRouterEmbeddingModel({
   providerId: "openrouter",
   modelId: "openai/text-embedding-3-small",
   url: "https://openrouter.ai/api/v1",
   apiKey: serverEnv.OPENROUTER_API_KEY,
});

export function buildLanguageInstruction(language: string): string {
   const languageMap: Record<string, string> = {
      "pt-BR":
         "OBRIGATÓRIO: Sempre escreva e responda EXCLUSIVAMENTE em Português Brasileiro (pt-BR). NUNCA use inglês ou qualquer outro idioma. Isso se aplica a TODO o conteúdo gerado, incluindo o que você passa para sub-agentes.",
      "en-US": "Always respond and write content in American English (en-US).",
      es: "Siempre responda y escriba contenido en Español.",
   };
   return `## IDIOMA DE SAÍDA\n${languageMap[language] ?? languageMap["pt-BR"]}`;
}

export type MastraLLMUsage = {
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   reasoningTokens?: number | null;
   cachedInputTokens?: number | null;
};

export function compileInstructionMemories(
   writerInstructions: InstructionMemoryItem[],
): string {
   const enabledInstructions = writerInstructions
      .filter((i) => i.enabled)
      .sort((a, b) => a.order - b.order);

   if (enabledInstructions.length === 0) return "";

   const content = enabledInstructions
      .map((i) => `### ${i.title}\n${i.content}`)
      .join("\n\n");

   return `\n# INSTRUCTION MEMORIES\n\n## WRITER INSTRUCTIONS\n${content}\n`;
}
