import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { mastra, setRuntimeContext } from "@packages/mastra";

export interface CreateCompetitorKnowledgeWorkflowJobData {
   websiteUrl: string;
   userId: string;
   competitorId: string;
   runtimeContext?: {
      language: "en" | "pt";
      userId: string;
   };
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

      if (runtimeContext) {
         setRuntimeContext(runtimeContext);
      }
      const result = await run.start({
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
      throw error;
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
