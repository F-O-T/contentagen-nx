import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runGenerateIdea } from "../../functions/writing/generate-idea";
import { runGrammarChecker } from "../../functions/writing/grammar-checker";
import type { PersonaConfig } from "@packages/database/schema";
import { emitIdeaStatusChanged } from "@packages/server-events";

export interface IdeasGrammarCheckJobData {
   agentId: string;
   keywords: string[];
   brandContext: string;
   sources: string[];
   webSnippets: string;
   userId: string;
   personaConfig: PersonaConfig;
   ideaIds: string[];
}

export interface IdeasGrammarCheckJobResult {
   agentId: string;
   keywords: string[];
   correctedIdeas: string[];
   sources: string[];
   userId: string;
   ideaIds: string[];
}

import { enqueueIdeasPostProcessingJob } from "./ideas-post-processing-queue";

export async function runIdeasGrammarCheck(
   payload: IdeasGrammarCheckJobData,
): Promise<IdeasGrammarCheckJobResult> {
   const {
      agentId,
      keywords,
      brandContext,
      webSnippets,
      userId,
      personaConfig,
      ideaIds,
   } = payload;

   try {
      // Emit status for all idea IDs
      for (const ideaId of ideaIds) {
         emitIdeaStatusChanged({
            ideaId,
            status: "pending",
            message: "Checking grammar and generating ideas...",
         });
      }

      // 1. Generate ideas (LLM)
      const { ideas } = await runGenerateIdea({
         brandContext,
         webSnippets,
         keywords,
         personaConfig,
      });

      // 2. Apply grammar checking to each idea
      const correctedIdeas: string[] = [];
      for (const idea of ideas) {
         try {
            const { correctedDraft } = await runGrammarChecker({
               personaConfig,
               text: idea,
               userId,
            });
            correctedIdeas.push(correctedDraft);
         } catch (error) {
            console.error(
               "[IdeasGrammarCheck] Grammar check failed for idea, using original",
               error,
            );
            // If grammar check fails, use original idea
            console.warn(
               `Grammar check failed for idea: ${idea}, using original`,
            );
            correctedIdeas.push(idea);
         }
      }

      // 3. Enqueue post-processing job
      await enqueueIdeasPostProcessingJob({
         agentId,
         keywords,
         correctedIdeas,
         sources: payload.sources,
         userId,
         ideaIds,
      });

      return {
         agentId,
         keywords,
         correctedIdeas,
         sources: payload.sources,
         userId,
         ideaIds,
      };
   } catch (error) {
      console.error("[IdeasGrammarCheck] PIPELINE ERROR", {
         agentId,
         keywords,
         ideaIds,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
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
