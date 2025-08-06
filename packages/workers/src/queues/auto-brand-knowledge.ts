import { Worker, Queue, type Job } from "bullmq";
import { runCrawlWebsiteForBrandKnowledge } from "../functions/crawl-website-for-brand-knowledge";
import { runChunkBrandDocument } from "../functions/chunk-brand-document";
import { runUploadBrandChunks } from "../functions/upload-brand-chunks";
import { runCreateBrandDocument } from "../functions/create-brand-document";
import { runDistillationPipeline } from "./knowledge-distillation";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";

interface AutoBrandKnowledgePayload {
   agentId: string;
   userId: string;
   websiteUrl: string;
}

const QUEUE_NAME = "auto-brand-knowledge";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const autoBrandKnowledgeQueue = new Queue<AutoBrandKnowledgePayload>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);

export const autoBrandKnowledgeWorker = new Worker<AutoBrandKnowledgePayload>(
   QUEUE_NAME,
   async (job: Job<AutoBrandKnowledgePayload>) => {
      const { agentId, websiteUrl } = job.data;
      // 1. Crawl Website
      const crawlResult = await runCrawlWebsiteForBrandKnowledge({
         websiteUrl,
      });
      if (!crawlResult || !crawlResult.allContent) {
         throw new Error("Failed to crawl the website for brand knowledge");
      }

      // 2. Create Brand Document
      const brandDocument = await runCreateBrandDocument({
         rawText: crawlResult.allContent,
      });
      if (!brandDocument || !brandDocument.content) {
         throw new Error("Failed to create brand document");
      }

      // 3. Chunk Brand Document
      const chunkBrandDocument = await runChunkBrandDocument({
         inputText: brandDocument.content,
      });
      if (!chunkBrandDocument || !chunkBrandDocument.chunks) {
         throw new Error("Failed to chunk brand document");
      }
      const chunks = (chunkBrandDocument.chunks || []).filter(Boolean);

      // 4. Upload Chunks
      const uploadResult = await runUploadBrandChunks({ agentId, chunks });
      if (!uploadResult || !uploadResult.uploadedFiles) {
         throw new Error("Failed to upload brand chunks");
      }
      const uploadedFiles = uploadResult.uploadedFiles;

      // 5. Trigger Knowledge Distillation for all uploaded files (Promise.all)
      await Promise.all(
         uploadedFiles.map((file) =>
            runDistillationPipeline({
               inputText: file.rawContent,
               agentId,
               sourceId: file.fileUrl,
            }),
         ),
      );
      // Done.
   },
   {
      connection: redis,
   },
);
