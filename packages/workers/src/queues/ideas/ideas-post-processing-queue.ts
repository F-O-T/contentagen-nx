import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { createDb } from "@packages/database/client";
import { updateIdea } from "@packages/database/repositories/ideas-repository";
import { emitIdeaStatusChanged } from "@packages/server-events";
import { runConfidenceScoring } from "../../functions/writing/confidence-scoring";

export interface IdeasPostProcessingJobData {
   agentId: string;
   keywords: string[];
   ideaId: string;
   title: string;
   description: string;
   sources: string[];
   userId: string;
   brandContext: string;
   webSnippets: string;
}

export interface IdeasPostProcessingJobResult {
   agentId: string;
   updatedIdeas: Array<{ id: string; title: string }>;
   userId: string;
}

export async function runIdeasPostProcessing(
   payload: IdeasPostProcessingJobData,
): Promise<IdeasPostProcessingJobResult> {
   const {
      agentId,
      keywords,
      ideaId,
      title,
      description,
      sources,
      userId,
      brandContext,
      webSnippets,
   } = payload;

   try {
      // Emit status for this idea
      emitIdeaStatusChanged({
         ideaId,
         status: "pending",
         message: "Finalizing idea...",
      });

      console.log(`[IdeasPostProcessing] Processing idea: ${title}`);

      // Validate the idea has content
      if (!title?.trim() || !description?.trim()) {
         console.error(`[IdeasPostProcessing] Invalid idea content:`, {
            ideaId,
            title,
            description,
         });
         throw new Error(`Invalid idea content for idea ${ideaId}`);
      }

      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

      const confirmedKeywords: string[] = keywords || [];
      const meta = { tags: confirmedKeywords, sources };

      const confidence = await runConfidenceScoring({
         title,
         description,
         brandContext,
         keywords: confirmedKeywords,
         marketIntelligence: webSnippets,
      });

      const updatedIdea = await updateIdea(db, ideaId, {
         content: { title, description },
         confidence,
         status: "pending",
         meta,
      });

      // Emit success event
      emitIdeaStatusChanged({
         ideaId: updatedIdea.id,
         status: "pending",
         message: `Idea finalized: ${title}`,
      });

      console.log(
         `[IdeasPostProcessing] Successfully processed idea: ${title}`,
      );

      return {
         agentId,
         updatedIdeas: [{ id: updatedIdea.id, title }],
         userId,
      };
   } catch (error) {
      console.error("[IdeasPostProcessing] PIPELINE ERROR", {
         agentId,
         keywords,
         ideaId,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });

      // Emit failure status
      emitIdeaStatusChanged({
         ideaId,
         status: "rejected",
         message: "Post-processing failed",
      });

      throw error;
   }
}

const QUEUE_NAME = "ideas-post-processing-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const ideasPostProcessingQueue = new Queue<IdeasPostProcessingJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(ideasPostProcessingQueue);

export async function enqueueIdeasPostProcessingJob(
   data: IdeasPostProcessingJobData,
   jobOptions?: Parameters<Queue<IdeasPostProcessingJobData>["add"]>[2],
) {
   return ideasPostProcessingQueue.add(QUEUE_NAME, data, jobOptions);
}

export const ideasPostProcessingWorker = new Worker<IdeasPostProcessingJobData>(
   QUEUE_NAME,
   async (job: Job<IdeasPostProcessingJobData>) => {
      await runIdeasPostProcessing(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(ideasPostProcessingWorker);
