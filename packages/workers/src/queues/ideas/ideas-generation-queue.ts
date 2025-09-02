import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runGenerateIdea } from "../../functions/writing/generate-idea";
import { emitIdeaStatusChanged } from "@packages/server-events";
import type { PersonaConfig } from "@packages/database/schema";

export interface IdeasGenerationJobData {
   agentId: string;
   keywords: string[];
   brandContext: string;
   webSnippets: string;
   userId: string;
   personaConfig: PersonaConfig;
   ideaIds: string[];
}

export interface IdeasGenerationJobResult {
   agentId: string;
   keywords: string[];
   generatedIdeas: { title: string; description: string }[];
   ideaIds: string[];
}

import { enqueueBulkIdeasGrammarCheckJob } from "./ideas-grammar-checker-queue";

export async function runIdeasGeneration(
   payload: IdeasGenerationJobData,
): Promise<IdeasGenerationJobResult> {
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
            message: "Generating ideas...",
         });
      }

      // Generate ideas using the improved function
      const { ideas: generatedIdeas } = await runGenerateIdea({
         brandContext,
         webSnippets,
         keywords,
         personaConfig,
      });

      console.log(
         `[IdeasGeneration] Successfully generated ${generatedIdeas.length} ideas for keywords: ${keywords.join(", ")}`,
      );

      // Emit status update
      for (const ideaId of ideaIds) {
         emitIdeaStatusChanged({
            ideaId,
            status: "pending",
            message: "Ideas generated, applying grammar check...",
         });
      }

      // Create bulk grammar check jobs
      const grammarCheckJobs = [];
      for (
         let i = 0;
         i < Math.min(generatedIdeas.length, ideaIds.length);
         i++
      ) {
         const idea = generatedIdeas[i];
         const ideaId = ideaIds[i];

         if (idea && ideaId) {
            grammarCheckJobs.push({
               agentId,
               keywords,
               brandContext,
               webSnippets,
               userId,
               personaConfig,
               ideaId, // Process one idea at a time
               idea, // Pass the specific idea to check
               sources: [], // Will be populated by planning queue
            });
         }

         // Enqueue all grammar check jobs in bulk
         if (grammarCheckJobs.length > 0) {
            await enqueueBulkIdeasGrammarCheckJob(grammarCheckJobs);
         }
      }

      return {
         agentId,
         keywords,
         generatedIdeas,
         ideaIds,
      };
   } catch (error) {
      console.error("[IdeasGeneration] PIPELINE ERROR", {
         agentId,
         keywords,
         ideaIds,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });

      // Emit failure status for all idea IDs
      for (const ideaId of ideaIds) {
         emitIdeaStatusChanged({
            ideaId,
            status: "pending",
            message: "Idea generation failed, will retry...",
         });
      }

      throw error;
   }
}

const QUEUE_NAME = "ideas-generation-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const ideasGenerationQueue = new Queue<IdeasGenerationJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(ideasGenerationQueue);

export async function enqueueIdeasGenerationJob(
   data: IdeasGenerationJobData,
   jobOptions?: Parameters<Queue<IdeasGenerationJobData>["add"]>[2],
) {
   return ideasGenerationQueue.add(QUEUE_NAME, data, jobOptions);
}

export const ideasGenerationWorker = new Worker<IdeasGenerationJobData>(
   QUEUE_NAME,
   async (job: Job<IdeasGenerationJobData>) => {
      await runIdeasGeneration(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(ideasGenerationWorker);
