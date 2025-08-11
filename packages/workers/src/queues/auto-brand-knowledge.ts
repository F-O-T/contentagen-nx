import { Worker, Queue, type Job } from "bullmq";
import { runCrawlWebsiteForBrandKnowledge } from "../functions/crawl-website-for-brand-knowledge";
import { runChunkBrandDocument } from "../functions/chunk-brand-document";
import { runUploadBrandChunks } from "../functions/upload-brand-chunks";
import { runCreateBrandDocument } from "../functions/create-brand-document";
import { knowledgeDistillationQueue } from "./knowledge-distillation";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";

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
registerGracefulShutdown(autoBrandKnowledgeQueue);

export const autoBrandKnowledgeWorker = new Worker<AutoBrandKnowledgePayload>(
   QUEUE_NAME,
   async (job: Job<AutoBrandKnowledgePayload>) => {
      const { agentId, websiteUrl, userId } = job.data;
      console.log(
         `[auto-brand-knowledge] Job started for agentId=${agentId}, url=${websiteUrl}`,
      );
      try {
         // 1. Crawl Website
         console.log("[auto-brand-knowledge] Crawling website...");
         const crawlResult = await runCrawlWebsiteForBrandKnowledge({
            websiteUrl,
            userId,
         });
         if (!crawlResult || !crawlResult.allContent) {
            console.error(
               "[auto-brand-knowledge] ERROR: Failed to crawl website.",
            );
            throw new Error("Failed to crawl the website for brand knowledge");
         }
         console.log(
            `[auto-brand-knowledge] Crawled content length: ${crawlResult.allContent.length}`,
         );

         // 2. Create Brand Document
         console.log("[auto-brand-knowledge] Creating brand document...");
         const brandDocument = await runCreateBrandDocument({
            rawText: crawlResult.allContent,
            userId,
         });
         if (!brandDocument || !brandDocument.content) {
            console.error(
               "[auto-brand-knowledge] ERROR: Failed to create brand document.",
            );
            throw new Error("Failed to create brand document");
         }
         console.log(
            `[auto-brand-knowledge] Brand document content length: ${brandDocument.content.length}`,
         );

         // 3. Chunk Brand Document
         console.log("[auto-brand-knowledge] Chunking brand document...");
         const chunkBrandDocument = await runChunkBrandDocument({
            inputText: brandDocument.content,
            userId,
         });
         if (!chunkBrandDocument || !chunkBrandDocument.chunks) {
            console.error(
               "[auto-brand-knowledge] ERROR: Failed to chunk brand document.",
            );
            throw new Error("Failed to chunk brand document");
         }
         const chunks = (chunkBrandDocument.chunks || []).filter(Boolean);
         console.log(
            `[auto-brand-knowledge] Chunked into ${chunks.length} chunks.`,
         );

         // 4. Upload Chunks
         console.log(
            `[auto-brand-knowledge] Uploading ${chunks.length} chunks...`,
         );
         const uploadResult = await runUploadBrandChunks({ agentId, chunks });
         if (!uploadResult || !uploadResult.uploadedFiles) {
            console.error(
               "[auto-brand-knowledge] ERROR: Failed to upload brand chunks.",
            );
            throw new Error("Failed to upload brand chunks");
         }
         const uploadedFiles = uploadResult.uploadedFiles;
         console.log(
            `[auto-brand-knowledge] Uploaded ${uploadedFiles.length} files.`,
         );

         // 5. Trigger Knowledge Distillation for all uploaded files (Promise.all)
         console.log(
            `[auto-brand-knowledge] Running knowledge distillation pipeline for ${uploadedFiles.length} files...`,
         );
         await knowledgeDistillationQueue.addBulk(
            uploadedFiles.map((file) => ({
               name: `knowledge-distillation-${file.fileUrl}`,
               data: {
                  userId,
                  inputText: file.rawContent,
                  agentId,
                  sourceId: file.fileUrl,
               },
            })),
         );
         console.log(
            `[auto-brand-knowledge] Knowledge distillation complete for agentId=${agentId}`,
         );
      } catch (err) {
         console.error("[auto-brand-knowledge] Unhandled error:", err);
         throw err;
      }
      // Done.
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(autoBrandKnowledgeWorker);
