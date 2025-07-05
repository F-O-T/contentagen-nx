import { Worker, Queue, type Job } from "bullmq";
import { redis } from "../../services/redis";
import { addChunk, updateChunk, deleteChunk } from "./rag-repository";
import type { KnowledgeChunkSelect } from "@api/schemas/agent-schema";

export type KnowledgeChunkJobAction = "create" | "update" | "delete";

export interface CreateKnowledgeChunkJobData {
   action: "create";
   data: KnowledgeChunkSelect;
}

export interface UpdateKnowledgeChunkJobData {
   action: "update";
   data: KnowledgeChunkSelect;
}

export interface DeleteKnowledgeChunkJobData {
   action: "delete";
   data: {
      chunkId: KnowledgeChunkSelect["id"];
   };
}
type RAGJobData =
   | CreateKnowledgeChunkJobData
   | UpdateKnowledgeChunkJobData
   | DeleteKnowledgeChunkJobData;

export const ragQueue = new Queue("rag-queue", {
   connection: redis,
   defaultJobOptions: {
      removeOnComplete: 25,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      delay: 500,
   },
});

export const ragWorker = new Worker(
   "rag-queue",
   async (job: Job<RAGJobData>) => {
      const { action, data } = job.data;
      job.log(`RAG job action: ${action}`);
      if (action === "create") {
         // Remove id, createdAt, updatedAt from data before insert
         const {
            id: _id,
            createdAt: _createdAt,
            updatedAt: _updatedAt,
            ...insertData
         } = data;
         const created = await addChunk(insertData);
         job.log(`Knowledge chunk created: ${created.id}`);
         return { id: created.id };
      }
      if (action === "update") {
         const {
            id: chunkId,
            createdAt: _createdAt,
            updatedAt: _updatedAt,
            ...fields
         } = data;
         const updated = await updateChunk(chunkId, fields);
         job.log(`Knowledge chunk updated: ${updated.id}`);
         return { id: updated.id };
      }
      if (action === "delete") {
         // data is { chunkId }
         await deleteChunk(data.chunkId);
         job.log(`Knowledge chunk deleted: ${data.chunkId}`);
         return { id: data.chunkId };
      }
      throw new Error(`Unknown action: ${action}`);
   },
   { connection: redis, concurrency: 4 },
);

ragWorker.on("error", (err) => {
   console.error("[RAG Worker] Error:", err);
});

ragWorker.on("failed", (job, err) => {
   console.error(`[RAG Worker] Job ${job?.id} failed:`, err);
});

ragWorker.on("completed", (job, result) => {
   console.log(`[RAG Worker] Job ${job.id} completed:`, result);
});

console.log("[RAG Worker] Started and listening for jobs...");
