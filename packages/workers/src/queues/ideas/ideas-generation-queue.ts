import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runGenerateIdea } from "../../functions/writing/generate-idea";
import { emitIdeaStatusChanged } from "@packages/server-events";
import type { PersonaConfig } from "@packages/database/schema";
import { createDb } from "@packages/database/client";
import { createIdea } from "@packages/database/repositories/ideas-repository";

export interface IdeasGenerationJobData {
   agentId: string;
   keywords: string[];
   brandContext: string;
   webSnippets: string;
   sources: string[];
   userId: string;
   personaConfig: PersonaConfig;
   ideaIds: string[];
}

export interface IdeasGenerationJobResult {
   agentId: string;
   keywords: string[];
   generatedIdeas: { title: string; description: string }[];
   sources: string[];
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
      sources,
      userId,
      personaConfig,
      ideaIds: _ideaIds, // Not used anymore, keeping for backward compatibility
   } = payload;

   let createdIdeaIds: string[] = [];

   try {
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

      // Create database entries for each generated idea
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const createdIdeaIds: string[] = [];

      for (let i = 0; i < generatedIdeas.length; i++) {
         const idea = generatedIdeas[i];
         if (!idea || !idea.title || !idea.description) {
            console.warn(
               `[IdeasGeneration] Skipping invalid idea at index ${i}`,
            );
            continue;
         }

         const createdIdea = await createIdea(db, {
            agentId,
            content: {
               title: idea.title,
               description: idea.description,
            },
            status: "pending",
         });

         createdIdeaIds.push(createdIdea.id);

         emitIdeaStatusChanged({
            ideaId: createdIdea.id,
            status: "pending",
            message: "Ideas generated, applying grammar check...",
         });
      }

      // Create bulk grammar check jobs for all created ideas
      const grammarCheckJobs = [];
      for (let i = 0; i < generatedIdeas.length; i++) {
         const idea = generatedIdeas[i];
         const ideaId = createdIdeaIds[i];

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
               sources, // Pass the sources from planning queue
            });
         }
      }

      // Enqueue all grammar check jobs in bulk
      if (grammarCheckJobs.length > 0) {
         await enqueueBulkIdeasGrammarCheckJob(grammarCheckJobs);
      }

      return {
         agentId,
         keywords,
         generatedIdeas,
         sources,
         ideaIds: createdIdeaIds,
      };
   } catch (error) {
      console.error("[IdeasGeneration] PIPELINE ERROR", {
         agentId,
         keywords,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });

      // Emit failure status for any created idea IDs (if any were created before the error)
      for (const ideaId of createdIdeaIds) {
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
