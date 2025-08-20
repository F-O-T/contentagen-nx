import { Worker, Queue, type Job } from "bullmq";
import { enqueueContentWritingJob } from "./content-writing-queue";
import type { ContentRequest, PersonaConfig } from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runExternalLinkCuration } from "../../functions/web-search/external-link-curation";
import { runWriteImprovedDescription } from "../../functions/writing/write-improved-description";
import { updateContentStatus } from "../../functions/database/update-content-status";

export interface ContentResearchJobData {
   userId: string;
   personaConfig: PersonaConfig;

   keywords: string[];
   chunks: string[];
   agentId: string;
   contentId: string;
   contentRequest: ContentRequest;
   optimizedQuery: string;
}

export async function runContentResearch(payload: ContentResearchJobData) {
   const {
      agentId,
      contentId,
      contentRequest,
      chunks,
      keywords,
      optimizedQuery,
      userId,
      personaConfig,
   } = payload;
   const { description } = contentRequest;
   try {
      // Update status to researching
      await updateContentStatus({
         contentId,
         status: "researching",
      });

      const [
         optimizedQueryReult,
         keywordsSearchResult,
         createBrandIntegrationDocumentResult,
      ] = await Promise.all([
         runExternalLinkCuration({ query: optimizedQuery, userId }),
         runExternalLinkCuration({ query: keywords.join(", "), userId }),
         runWriteImprovedDescription({ chunks, userId, description }),
      ]);
      const searchSources = () => {
         const allSources = [
            ...keywordsSearchResult.results,
            ...optimizedQueryReult.results,
         ];
         const uniqueSources = Array.from(
            new Set(allSources.map((result) => result.url).filter(Boolean)),
         );
         return uniqueSources;
      };
      const getSearchResults = () => {
         const allResults = [
            ...keywordsSearchResult.results,
            ...optimizedQueryReult.results,
         ];
         const uniqueContents = Array.from(
            new Set(
               allResults
                  .map((result) => result.content?.trim())
                  .filter((content) => !!content && content.length > 0),
            ),
         );
         return uniqueContents.join("\n\n");
      };
      const { brandIntegrationDocumentation } =
         createBrandIntegrationDocumentResult;

      // Enqueue next job in pipeline (writing)
      await enqueueContentWritingJob({
         agentId,
         contentId,
         keywords,
         contentRequest,
         userId,
         searchSources: searchSources(),
         webSearchContent: getSearchResults(),
         brandDocument: brandIntegrationDocumentation,
         personaConfig,
      });

      return {
         userId,
         searchSources: searchSources(),
         webSearchContent: getSearchResults(),
         brandDocument: brandIntegrationDocumentation,
         contentRequest,
      };
   } catch (error) {
      console.error("[ContentGeneration] PIPELINE ERROR", {
         agentId,
         contentId,
         contentRequest,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-researching-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentResearchingQueue = new Queue<ContentResearchJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(contentResearchingQueue);

export async function enqueueContentResearchJob(
   data: ContentResearchJobData,
   jobOptions?: Parameters<Queue<ContentResearchJobData>["add"]>[2],
) {
   return contentResearchingQueue.add(QUEUE_NAME, data, jobOptions);
}

export const contentResearchingWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<ContentResearchJobData>) => {
      await runContentResearch(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(contentResearchingWorker);
