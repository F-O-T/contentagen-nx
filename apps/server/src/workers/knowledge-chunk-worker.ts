import { Queue, Worker, type Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../integrations/database";
import { knowledgeChunk } from "../schemas/agent-schema";
import { redis } from "../services/redis";

export type KnowledgeChunkJobData =
   | {
        action: "create";
        agentId: string;
        content: string;
        summary?: string;
        category?: string;
        keywords?: string[];
        source?: string;
        sourceType?: string;
        sourceIdentifier?: string;
        embedding: number[];
     }
   | {
        action: "update";
        chunkId: string;
        content?: string;
        summary?: string;
        category?: string;
        keywords?: string[];
        source?: string;
        sourceType?: string;
        sourceIdentifier?: string;
        embedding?: number[];
     }
   | {
        action: "delete";
        chunkId: string;
     };

export const knowledgeChunkQueue = new Queue("knowledge-chunk", {
   connection: redis,
   defaultJobOptions: {
      removeOnComplete: 25,
      removeOnFail: 50,
      attempts: 2,
      backoff: {
         type: "exponential",
         delay: 2000,
      },
      delay: 500,
   },
});

export const knowledgeChunkWorker = new Worker(
   "knowledge-chunk",
   async (job: Job<KnowledgeChunkJobData>) => {
      const { action } = job.data;
      job.log(`Knowledge chunk job action: ${action}`);
      if (action === "create") {
         const {
            agentId,
            content,
            summary,
            category,
            keywords,
            source,
            sourceType,
            sourceIdentifier,
            embedding,
         } = job.data;
         const [created] = await db
            .insert(knowledgeChunk)
            .values({
               agentId,
               content,
               summary,
               category,
               keywords,
               source,
               sourceType,
               sourceIdentifier,
               embedding,
            })
            .returning();
         if (!created) throw new Error("Failed to create knowledge chunk");
         job.log(`Knowledge chunk created: ${created.id}`);
         return { id: created.id };
      }
      if (action === "update") {
         const { chunkId, ...fields } = job.data;
         const [updated] = await db
            .update(knowledgeChunk)
            .set({ ...fields, updatedAt: new Date() })
            .where(eq(knowledgeChunk.id, chunkId))
            .returning();
         if (!updated) throw new Error("Failed to update knowledge chunk");
         job.log(`Knowledge chunk updated: ${updated.id}`);
         return { id: updated.id };
      }
      if (action === "delete") {
         const { chunkId } = job.data;
         const deleted = await db
            .delete(knowledgeChunk)
            .where(eq(knowledgeChunk.id, chunkId));
         if (!deleted) throw new Error("Failed to delete knowledge chunk");
         job.log(`Knowledge chunk deleted: ${chunkId}`);
         return { id: chunkId };
      }
      throw new Error(`Unknown action: ${action}`);
   },
   { connection: redis, concurrency: 2 },
);

knowledgeChunkWorker.on("error", (err) => {
   console.error("Knowledge chunk worker error:", err);
});

knowledgeChunkWorker.on("failed", (job, err) => {
   console.error(`Knowledge chunk job ${job?.id} failed:`, err);
});

knowledgeChunkWorker.on("completed", (job, result) => {
   console.log(`Knowledge chunk job ${job.id} completed:`, result);
});
