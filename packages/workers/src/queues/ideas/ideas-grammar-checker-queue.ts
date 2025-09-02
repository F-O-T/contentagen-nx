import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runIdeaGrammarChecker } from "../../functions/writing/grammar-checker";
import { emitIdeaStatusChanged } from "@packages/server-events";
import type { PersonaConfig } from "@packages/database/schema";

export interface IdeasGrammarCheckJobData {
   agentId: string;
   keywords: string[];
   sources: string[];
   userId: string;
   personaConfig: PersonaConfig;
   ideaId: string;
   idea: { title: string; description: string };
   brandContext: string;
   webSnippets: string;
}

export interface IdeasGrammarCheckJobResult {
   agentId: string;
   keywords: string[];
   ideaId: string;
   title: string;
   description: string;
   sources: string[];
   userId: string;
}

import { enqueueIdeasPostProcessingJob } from "./ideas-post-processing-queue";

export async function runIdeasGrammarCheck(
   payload: IdeasGrammarCheckJobData,
): Promise<IdeasGrammarCheckJobResult> {
   const {
      agentId,
      keywords,
      userId,
      personaConfig,
      ideaId,
      idea,
   } = payload;

   try {
      // Emit status for this idea
      emitIdeaStatusChanged({
         ideaId,
         status: "pending",
         message: "Checking grammar...",
      });

      console.log(`[IdeasGrammarCheck] Processing single idea: ${idea.title}`);

      // Validate idea has required content before grammar checking
      if (!idea || !idea.title?.trim() || !idea.description?.trim()) {
         console.warn(
            `[IdeasGrammarCheck] Invalid idea, skipping grammar check:`,
            idea,
         );

         const correctedIdea = {
            title: idea?.title?.trim() || `Content Idea`,
            description:
               idea?.description?.trim() ||
               `Generated content for keywords: ${keywords.join(", ")}`,
         };

         // Enqueue post-processing for this single idea
         await enqueueIdeasPostProcessingJob({
            agentId,
            keywords,
            ideaId,
            title: correctedIdea.title,
            description: correctedIdea.description,
            sources: payload.sources,
            userId,
            brandContext: payload.brandContext,
            webSnippets: payload.webSnippets,
         });

         return {
            agentId,
            keywords,
            ideaId,
            title: correctedIdea.title,
            description: correctedIdea.description,
            sources: payload.sources,
            userId,
         };
      }

      // Apply grammar checking to the single idea
      const result = await runIdeaGrammarChecker({
         idea,
         userId,
         personaConfig,
      });

      // Validate the corrected idea
      let correctedIdea: { title: string; description: string };

      if (
         result.correctedIdea?.title?.trim() &&
         result.correctedIdea.description?.trim()
      ) {
         correctedIdea = result.correctedIdea;
         console.log(
            `[IdeasGrammarCheck] Grammar check successful for idea: ${ideaId}`,
         );
      } else {
         console.warn(
            `[IdeasGrammarCheck] Grammar check returned invalid result, using original`,
         );
         correctedIdea = idea;
      }

      // Enqueue post-processing for this single idea
      await enqueueIdeasPostProcessingJob({
         agentId,
         keywords,
         ideaId,
         title: correctedIdea.title,
         description: correctedIdea.description,
         sources: payload.sources,
         userId,
         brandContext: payload.brandContext,
         webSnippets: payload.webSnippets,
      });

      return {
         agentId,
         keywords,
         ideaId,
         title: correctedIdea.title,
         description: correctedIdea.description,
         sources: payload.sources,
         userId,
      };
   } catch (error) {
      console.error("[IdeasGrammarCheck] PIPELINE ERROR", {
         agentId,
         keywords,
         ideaId,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });

      // On error, use the original idea and still enqueue post-processing
      const fallbackIdea = {
         title: idea?.title?.trim() || `Content Idea`,
         description:
            idea?.description?.trim() ||
            `Generated content for keywords: ${keywords.join(", ")}`,
      };

      await enqueueIdeasPostProcessingJob({
         agentId,
         keywords,
         ideaId,
         title: fallbackIdea.title,
         description: fallbackIdea.description,
         sources: payload.sources,
         userId,
         brandContext: payload.brandContext,
         webSnippets: payload.webSnippets,
      });

      return {
         agentId,
         keywords,
         ideaId,
         title: fallbackIdea.title,
         description: fallbackIdea.description,
         sources: payload.sources,
         userId,
      };
   }
}

const QUEUE_NAME = "ideas-grammar-checker-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const ideasGrammarCheckQueue = new Queue<IdeasGrammarCheckJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(ideasGrammarCheckQueue);

export async function enqueueIdeasGrammarCheckJob(
   data: IdeasGrammarCheckJobData,
   jobOptions?: Parameters<Queue<IdeasGrammarCheckJobData>["add"]>[2],
) {
   return ideasGrammarCheckQueue.add(QUEUE_NAME, data, jobOptions);
}

export async function enqueueBulkIdeasGrammarCheckJob(
   jobs: IdeasGrammarCheckJobData[],
) {
   const bulkJobs = jobs.map((jobData) => ({
      name: QUEUE_NAME,
      data: jobData,
   }));

   return ideasGrammarCheckQueue.addBulk(bulkJobs);
}

export const ideasGrammarCheckWorker = new Worker<IdeasGrammarCheckJobData>(
   QUEUE_NAME,
   async (job: Job<IdeasGrammarCheckJobData>) => {
      await runIdeasGrammarCheck(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(ideasGrammarCheckWorker);
