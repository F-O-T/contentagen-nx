import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";

export interface CreateCompetitorKnowledgeWorkflowJobData {
   websiteUrl: string;
   userId: string;
   competitorId: string;
   runtimeContext?: CustomRuntimeContext;
}

export async function runCreateCompetitorKnowledgeWorkflow(
   payload: CreateCompetitorKnowledgeWorkflowJobData,
) {
   const { websiteUrl, userId, competitorId, runtimeContext } = payload;

   // Restore runtime context if it exists

   try {
      const run = await mastra
         .getWorkflow("createBrandKnowledgeWorkflow")
         .createRunAsync();

      const result = await run.start({
         runtimeContext: setRuntimeContext({
            language: runtimeContext?.language ?? "en",
            userId,
         }),

         inputData: {
            websiteUrl,
            userId,
            id: competitorId,
            target: "competitor",
         },
      });

      return {
         userId,
         competitorId,
         websiteUrl,
         result,
      };
   } catch (error) {
      console.error("[CreateCompetitorKnowledgeWorkflow] WORKFLOW ERROR", {
         websiteUrl,
         userId,
         competitorId,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      propagateError(error);
      throw AppError.internal(
         `Competitor knowledge workflow failed: ${(error as Error).message}`
      );
   }
}

const QUEUE_NAME = "create-competitor-knowledge-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createCompetitorKnowledgeWorkflowQueue =
   new Queue<CreateCompetitorKnowledgeWorkflowJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(createCompetitorKnowledgeWorkflowQueue);

export async function enqueueCreateCompetitorKnowledgeWorkflowJob(
   data: CreateCompetitorKnowledgeWorkflowJobData,
   jobOptions?: Parameters<
      Queue<CreateCompetitorKnowledgeWorkflowJobData>["add"]
   >[2],
) {
   return createCompetitorKnowledgeWorkflowQueue.add(
      QUEUE_NAME,
      data,
      jobOptions,
   );
}

export const createCompetitorKnowledgeWorkflowWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<CreateCompetitorKnowledgeWorkflowJobData>) => {
      await runCreateCompetitorKnowledgeWorkflow(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(createCompetitorKnowledgeWorkflowWorker);
