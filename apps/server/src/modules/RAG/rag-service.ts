import { findChunksBySource } from "./rag-repository";
import type { KnowledgeSource } from "@api/schemas/agent-schema";
import { generateEmbedding } from "./rag-utils";

export async function findSimilarChunksForString(
   content: string,
   agentId: string,
   source: KnowledgeSource,
) {
   const embedding = await generateEmbedding(content);
   return findChunksBySource(embedding, { agentId, source });
}
