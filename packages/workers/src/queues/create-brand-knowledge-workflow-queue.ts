import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import { mastra, setRuntimeContext } from "@packages/agents";

export interface CreateBrandKnowledgeWorkflowJobData {
   websiteUrl: string;
   userId: string;
   agentId: string;
   runtimeContext?: {
      language: "en" | "pt";
      userId: string;
   };
}

export async function runCreateBrandKnowledgeWorkflow(
   payload: CreateBrandKnowledgeWorkflowJobData,
) {
   const { websiteUrl, userId, agentId, runtimeContext } = payload;

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
            id: agentId,
            target: "brand",
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
