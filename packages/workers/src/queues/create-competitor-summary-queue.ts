import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";
import { createDb } from "@packages/database/client";
import { updateCompetitorSummary } from "@packages/database/repositories/competitor-summary-repository";

export interface CreateCompetitorSummaryJobData {
   organizationId: string;
   userId: string;
   summaryId: string;
   runtimeContext?: CustomRuntimeContext;
}

export async function runCreateCompetitorSummaryJob(
   payload: CreateCompetitorSummaryJobData,
) {
   const { organizationId, userId, summaryId, runtimeContext } = payload;

   try {
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

      // Update status to generating
      await updateCompetitorSummary(db, summaryId, {
         status: "generating",
      });

      // Run the competitor summary workflow
      const run = await mastra
         .getWorkflow("createCompetitorSummaryWorkflow")
         .createRunAsync();

      await run.start({
         runtimeContext: setRuntimeContext({
            language: runtimeContext?.language ?? "en",
            userId,
         }),
         inputData: {
            organizationId,
            userId,
            summaryId,
         },
      });

      return {
         summaryId,
         organizationId,
      };
   } catch (error) {
      console.error("[CreateCompetitorSummary] JOB ERROR", {
         organizationId,
         userId,
         summaryId,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });

      // Update with error status
      try {
         const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
         await updateCompetitorSummary(db, summaryId, {
            status: "failed",
            errorMessage:
               error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
         });
      } catch (dbError) {
         console.error("Failed to update error status:", dbError);
      }

      propagateError(error);
      throw AppError.internal(
         `Competitor summary generation failed: ${(error as Error).message}`,
      );
   }
}

const QUEUE_NAME = "create-competitor-summary";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createCompetitorSummaryQueue =
   new Queue<CreateCompetitorSummaryJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(createCompetitorSummaryQueue);

export async function enqueueCreateCompetitorSummaryJob(
   data: CreateCompetitorSummaryJobData,
   jobOptions?: Parameters<Queue<CreateCompetitorSummaryJobData>["add"]>[2],
) {
   return createCompetitorSummaryQueue.add(QUEUE_NAME, data, jobOptions);
}

export const createCompetitorSummaryWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<CreateCompetitorSummaryJobData>) => {
      await runCreateCompetitorSummaryJob(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(createCompetitorSummaryWorker);

