import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";

export interface CreateCompleteKnowledgeWorkflowJobData {
   websiteUrl: string;
   userId: string;
   id: string;
   target: "brand" | "competitor";
   runtimeContext?: CustomRuntimeContext;
}

export async function runCreateCompleteKnowledgeWorkflow(
   payload: CreateCompleteKnowledgeWorkflowJobData,
) {
   const { websiteUrl, userId, id, target, runtimeContext } = payload;

   // Restore runtime context if it exists

   try {
      const run = await mastra
         .getWorkflow("createCompleteKnowledgeWorkflow")
         .createRunAsync();

      const result = await run.start({
         runtimeContext: setRuntimeContext({
            language: runtimeContext?.language ?? "en",
            userId,
         }),

         inputData: {
            websiteUrl,
            userId,
            id,
            target,
         },
      });

      return {
         userId,
         id,
         websiteUrl,
         target,
         result,
      };
   } catch (error) {
      console.error("[CreateCompleteKnowledgeWorkflow] WORKFLOW ERROR", {
         websiteUrl,
         userId,
         id,
         target,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      propagateError(error);
      throw AppError.internal(
         `Complete knowledge workflow failed: ${(error as Error).message}`,
      );
   }
}

const QUEUE_NAME = "create-complete-knowledge-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createCompleteKnowledgeWorkflowQueue =
   new Queue<CreateCompleteKnowledgeWorkflowJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(createCompleteKnowledgeWorkflowQueue);

export async function enqueueCreateCompleteKnowledgeWorkflowJob(
   data: CreateCompleteKnowledgeWorkflowJobData,
   jobOptions?: Parameters<
      Queue<CreateCompleteKnowledgeWorkflowJobData>["add"]
   >[2],
) {
   return createCompleteKnowledgeWorkflowQueue.add(
      QUEUE_NAME,
      data,
      jobOptions,
   );
}

export const createCompleteKnowledgeWorkflowWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<CreateCompleteKnowledgeWorkflowJobData>) => {
      await runCreateCompleteKnowledgeWorkflow(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(createCompleteKnowledgeWorkflowWorker);

