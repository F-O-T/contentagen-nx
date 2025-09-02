import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runGenerateIdea } from "../../functions/writing/generate-idea";
import { emitIdeaStatusChanged } from "@packages/server-events";
import type { PersonaConfig } from "@packages/database/schema";
import { createDb } from "@packages/database/client";
import { createIdea } from "@packages/database/repositories/ideas-repository";
import type { IdeaContentSchema } from "@packages/database/schema";

export interface IdeasGenerationJobData {
   agentId: string;
   keywords: string[];
   brandContext: string;
   webSnippets: string;
   sources: string[];
   userId: string;
   personaConfig: PersonaConfig;
}

export interface IdeasGenerationJobResult {
   agentId: string;
   keywords: string[];
   generatedIdeas: IdeaContentSchema[];
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
   } = payload;

   const createdIdeaIds: string[] = [];

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

      // Create database entries for each generated idea and track successful creations
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const createdIdeasMap: Array<{
         idea: IdeaContentSchema;
         ideaId: string;
      }> = [];

      for (const idea of generatedIdeas) {
         if (!idea || !idea.title || !idea.description) {
            console.warn(`[IdeasGeneration] Skipping invalid idea`, {
               title: idea?.title,
               description: idea?.description,
            });
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
         createdIdeasMap.push({ idea, ideaId: createdIdea.id });

         emitIdeaStatusChanged({
            ideaId: createdIdea.id,
            status: "pending",
            message: "Ideas generated, applying grammar check...",
         });
      }

      // Create bulk grammar check jobs for all successfully created ideas
      const grammarCheckJobs = createdIdeasMap.map(({ idea, ideaId }) => ({
         agentId,
         keywords,
         brandContext,
         webSnippets,
         userId,
         personaConfig,
         ideaId,
         idea,
         sources,
      }));

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
