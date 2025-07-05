import { findChunksBySource } from "./rag-repository";

import type { KnowledgeSource } from "@api/schemas/agent-schema";
import {
   type CreateKnowledgeChunkJobData,
   type DeleteKnowledgeChunkJobData,
   ragQueue,
   type UpdateKnowledgeChunkJobData,
} from "./rag-worker";

import { generateEmbedding } from "./rag-utils";

export async function queueCreateChunk({
   data,
}: Omit<CreateKnowledgeChunkJobData, "action">) {
   return ragQueue.add("rag-operation", { ...data, action: "create" });
}

// Queue a job to update a knowledge chunk
export async function queueUpdateChunk({
   data,
}: Omit<UpdateKnowledgeChunkJobData, "action">) {
   return ragQueue.add("rag-operation", { ...data, action: "update" });
}

// Queue a job to delete a knowledge chunk
export async function queueDeleteChunk({
   data: { chunkId },
}: Omit<DeleteKnowledgeChunkJobData, "action">) {
   return ragQueue.add("rag-operation", { action: "delete", chunkId });
}

export async function findSimilarChunksForString(
   content: string,
   agentId: string,
   source: KnowledgeSource,
) {
   const embedding = await generateEmbedding(content);
   return findChunksBySource(embedding, { agentId, source });
}
