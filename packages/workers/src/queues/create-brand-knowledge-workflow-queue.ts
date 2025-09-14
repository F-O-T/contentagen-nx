import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { mastra } from "@packages/mastra";

export interface CreateBrandKnowledgeWorkflowJobData {
   websiteUrl: string;
   userId: string;
   agentId: string;
}

export async function runCreateBrandKnowledgeWorkflow(
   payload: CreateBrandKnowledgeWorkflowJobData,
) {
   const { websiteUrl, userId, agentId } = payload;

   try {
      const run = await mastra
         .getWorkflow("createBrandKnowledgeWorkflow")
         .createRunAsync();

      const result = await run.start({
         inputData: {
            websiteUrl,
            userId,
            agentId,
         },
      });

      return {
         userId,
         agentId,
         websiteUrl,
         result,
      };
   } catch (error) {
      console.error("[CreateBrandKnowledgeWorkflow] WORKFLOW ERROR", {
         websiteUrl,
         userId,
         agentId,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "create-brand-knowledge-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createBrandKnowledgeWorkflowQueue =
   new Queue<CreateBrandKnowledgeWorkflowJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(createBrandKnowledgeWorkflowQueue);

export async function enqueueCreateBrandKnowledgeWorkflowJob(
   data: CreateBrandKnowledgeWorkflowJobData,
   jobOptions?: Parameters<
      Queue<CreateBrandKnowledgeWorkflowJobData>["add"]
   >[2],
) {
   return createBrandKnowledgeWorkflowQueue.add(QUEUE_NAME, data, jobOptions);
}

export const createBrandKnowledgeWorkflowWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<CreateBrandKnowledgeWorkflowJobData>) => {
      await runCreateBrandKnowledgeWorkflow(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(createBrandKnowledgeWorkflowWorker);
