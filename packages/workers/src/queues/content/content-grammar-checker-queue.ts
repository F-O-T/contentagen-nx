import { Worker, Queue, type Job } from "bullmq";
import type { ContentRequest, PersonaConfig } from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { updateContentStatus } from "../../functions/database/update-content-status";
import { registerGracefulShutdown } from "../../helpers";
import { runGrammarChecker } from "../../functions/writing/grammar-checker";
import { enqueueContentPostProcessingJob } from "./content-post-processing-queue";

export interface ContentGrammarCheckJobData {
   userId: string;
   contentId: string;
   agentId: string;
   contentRequest: ContentRequest;
   personaConfig: PersonaConfig;
   draft: string;
   searchSources: string[];
   keywords: string[];
}

export interface ContentGrammarCheckJobResult {
   correctedDraft: string;
   contentRequest: ContentRequest;
   agentId: string;
   contentId: string;
   userId: string;
}

// Placeholder for grammar checking logic
async function runGrammarCheckContent(
   payload: ContentGrammarCheckJobData,
): Promise<ContentGrammarCheckJobResult> {
   const { userId, contentId, agentId, contentRequest, personaConfig, draft } =
      payload;
   try {
      // Update status to grammar_checking
      await updateContentStatus({
         contentId,
         status: "grammar_checking",
      });

      const { correctedDraft } = await runGrammarChecker({
         personaConfig,
         text: draft,
         userId,
      });

      await enqueueContentPostProcessingJob({
         searchSources: payload.searchSources,
         keywords: payload.keywords,
         agentId,
         contentId,
         userId,
         contentRequest,
         editedDraft: correctedDraft,
      });

      return { correctedDraft, contentRequest, agentId, contentId, userId };
   } catch (error) {
      console.error("[ContentGrammarCheck] PIPELINE ERROR", {
         agentId,
         contentId,
         contentRequest,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-grammar-checker-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentGrammarCheckQueue = new Queue<ContentGrammarCheckJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(contentGrammarCheckQueue);

export async function enqueueContentGrammarCheckJob(
   data: ContentGrammarCheckJobData,
   jobOptions?: Parameters<Queue<ContentGrammarCheckJobData>["add"]>[2],
) {
   return contentGrammarCheckQueue.add(QUEUE_NAME, data, jobOptions);
}

export const contentGrammarCheckWorker = new Worker<ContentGrammarCheckJobData>(
   QUEUE_NAME,
   async (job: Job<ContentGrammarCheckJobData>) => {
      await runGrammarCheckContent(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(contentGrammarCheckWorker);

// Helper to generate a grammar check job object
export function createContentGrammarCheckJobObject(params: {
   userId: string;
   contentId: string;
   agentId: string;
   contentRequest: ContentRequest;
   personaConfig: PersonaConfig;
   draft: string;
   searchSources: string[];
   keywords: string[];
}): ContentGrammarCheckJobData {
   return {
      userId: params.userId,
      contentId: params.contentId,
      agentId: params.agentId,
      contentRequest: params.contentRequest,
      personaConfig: params.personaConfig,
      draft: params.draft,
      searchSources: params.searchSources,
      keywords: params.keywords,
   };
}
