import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";

export type CreateOverviewJob = {
   id: string;
   userId: string;
   websiteUrl: string;
   target: "brand" | "competitor";
   runtimeContext?: CustomRuntimeContext;
};

const QUEUE = "create-overview";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createOverviewQueue = new Queue<CreateOverviewJob>(QUEUE, {
   connection: redis,
});
registerGracefulShutdown(createOverviewQueue);

export async function enqueueCreateOverviewJob(job: CreateOverviewJob) {
   return createOverviewQueue.add(QUEUE, job);
}

export const createOverviewWorker = new Worker<CreateOverviewJob>(
   QUEUE,
   async (job: Job<CreateOverviewJob>) => {
      const { id, userId, websiteUrl, target, runtimeContext } = job.data;

      try {
         // Restore runtime context if it exists
         const run = await mastra
            .getWorkflow("createOverviewWorkflow")
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
         console.error("[CreateOverview] WORKFLOW ERROR", {
            id,
            userId,
            websiteUrl,
            target,
            error: error instanceof Error ? error.message : error,
            stack:
               error instanceof Error && error.stack ? error.stack : undefined,
         });
         propagateError(error);
         throw AppError.internal(
            `Create overview workflow failed: ${(error as Error).message}`,
         );
      }
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(createOverviewWorker);

