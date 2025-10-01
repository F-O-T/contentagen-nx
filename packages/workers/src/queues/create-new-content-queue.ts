import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import type { ContentRequest } from "@packages/database/schemas/content";

export type CreateNewContentWorkflowJobData = {
   userId: string;
   competitorIds: string[];
   contentId: string;
   organizationId: string;
   agentId: string;
   request: ContentRequest;
   runtimeContext?: CustomRuntimeContext;
};
export async function runCreateNewContentWorkflow(
   payload: CreateNewContentWorkflowJobData,
) {
   const {
      userId,
      competitorIds,
      agentId,
      organizationId,
      request,
      runtimeContext,
      contentId,
   } = payload;

   try {
      const run = await mastra
         .getWorkflow("createNewContentWorkflow")
         .createRunAsync();

      const result = await run.start({
         runtimeContext: setRuntimeContext({
            language: runtimeContext?.language ?? "en",
            userId,
            agentId,
         }),
         inputData: {
            contentId,
            competitorIds,
            organizationId,
            request,
            userId,
            agentId,
         },
      });

      return {
         userId,
         result,
      };
   } catch (error) {
      console.error("[CreateNewContentWorkflow] WORKFLOW ERROR");
      throw error;
   }
}

const QUEUE_NAME = "create-new-content-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createNewContentWorkflowQueue =
   new Queue<CreateNewContentWorkflowJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(createNewContentWorkflowQueue);

export async function enqueueCreateNewContentWorkflowJob(
   data: CreateNewContentWorkflowJobData,
   jobOptions?: Parameters<Queue<CreateNewContentWorkflowJobData>["add"]>[2],
) {
   return createNewContentWorkflowQueue.add(QUEUE_NAME, data, jobOptions);
}

export const createNewContentWorkflowWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<CreateNewContentWorkflowJobData>) => {
      await runCreateNewContentWorkflow(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(createNewContentWorkflowWorker);
