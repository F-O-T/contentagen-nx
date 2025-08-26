import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runCrawlWebsiteForBrandKnowledge } from "../../functions/web-search/crawl-website-for-brand-knowledge";
import { emitAgentKnowledgeStatusChanged } from "@packages/server-events";
import { updateAgent } from "@packages/database/repositories/agent-repository";
import { createDb } from "@packages/database/client";
import { runWriteBrandDocument } from "../../functions/writing/write-brand-document";
import { runCreateBrandDocuments } from "../../functions/chunking/get-brand-document-chunks";
import { runUploadBrandChunks } from "../../functions/storage/upload-brand-chunks";

import { enqueueDocumentChunkJobsBulk } from "./document-chunk-queue";
export interface AutoBrandKnowledgeJob {
   agentId: string;
   userId: string;
   websiteUrl: string;
}

import type { BrandKnowledgeStatus } from "@packages/database/schemas/agent";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
async function updateAgentKnowledgeStatus(
   agentId: string,
   status: BrandKnowledgeStatus,
   message: string,
) {
   await updateAgent(db, agentId, { brandKnowledgeStatus: status });
   emitAgentKnowledgeStatusChanged({ agentId, status, message });
}

export async function runAutoBrandKnowledge(payload: AutoBrandKnowledgeJob) {
   const { agentId, websiteUrl, userId } = payload;
   await updateAgentKnowledgeStatus(
      agentId,
      "crawling",
      `Starting crawl of ${websiteUrl}`,
   );
   const { results } = await runCrawlWebsiteForBrandKnowledge({
      userId,
      websiteUrl,
   });
   await updateAgentKnowledgeStatus(
      agentId,
      "crawling",
      `Crawled ${results.length} pages from ${websiteUrl}`,
   );

   await updateAgentKnowledgeStatus(
      agentId,
      "analyzing",
      `Generating brand document for ${websiteUrl}`,
   );
   const { fullBrandAnalysis } = await runWriteBrandDocument({
      userId,
      websiteData: results.map((r) => r.rawContent).join("\n\n"),
   });

   await updateAgentKnowledgeStatus(
      agentId,
      "analyzing",
      `Generated brand document for ${websiteUrl}: ${fullBrandAnalysis}`,
   );

   await updateAgentKnowledgeStatus(
      agentId,
      "chunking",
      `Creating your documents`,
   );

   const { documents } = await runCreateBrandDocuments({
      userId,
      inputText: fullBrandAnalysis,
   });

   await updateAgentKnowledgeStatus(
      agentId,
      "chunking",
      `Created ${documents.length} documents`,
   );

   // Enqueue document chunk jobs in bulk (typesafe)

   await updateAgentKnowledgeStatus(
      agentId,
      "chunking",
      `Uploading and indexing your documents`,
   );
   const { uploadedFiles } = await runUploadBrandChunks({
      agentId,
      chunks: documents.map((d) => d.content),
   });

   await updateAgentKnowledgeStatus(
      agentId,
      "completed",
      `Uploaded and indexed ${uploadedFiles.length} documents`,
   );
   await enqueueDocumentChunkJobsBulk(
      uploadedFiles.map((doc) => ({
         inputText: doc.rawContent,
         sourceId: doc.fileUrl,
         agentId,
         userId,
      })),
   );
}

const QUEUE_NAME = "brand-knowledge";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const autoBrandKnowledgeQueue = new Queue<AutoBrandKnowledgeJob>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(autoBrandKnowledgeQueue);

export async function enqueueAutoBrandKnowledgeJob(job: AutoBrandKnowledgeJob) {
   return autoBrandKnowledgeQueue.add("brand-knowledge", job);
}

export const autoBrandKnowledgeWorker = new Worker<AutoBrandKnowledgeJob>(
   QUEUE_NAME,
   async (job: Job<AutoBrandKnowledgeJob>) => {
      await runAutoBrandKnowledge(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(autoBrandKnowledgeWorker);
