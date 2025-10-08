import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";

export type CreateKnowledgeAndIndexDocumentsJob = {
   id: string;
   userId: string;
   websiteUrl: string;
   target: "brand" | "competitor";
   runtimeContext?: CustomRuntimeContext;
};

const QUEUE = "create-knowledge-and-index-documents";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createKnowledgeAndIndexDocumentsQueue =
   new Queue<CreateKnowledgeAndIndexDocumentsJob>(QUEUE, {
      connection: redis,
   });
registerGracefulShutdown(createKnowledgeAndIndexDocumentsQueue);

export async function enqueueCreateKnowledgeAndIndexDocumentsJob(
   job: CreateKnowledgeAndIndexDocumentsJob,
) {
   return createKnowledgeAndIndexDocumentsQueue.add(QUEUE, job);
}

export const createKnowledgeAndIndexDocumentsWorker =
   new Worker<CreateKnowledgeAndIndexDocumentsJob>(
      QUEUE,
      async (job: Job<CreateKnowledgeAndIndexDocumentsJob>) => {
         const { id, userId, websiteUrl, target, runtimeContext } = job.data;

         try {
            // Restore runtime context if it exists
            const run = await mastra
               .getWorkflow("createKnowledgeAndIndexDocumentsWorkflow")
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
            console.error("[CreateKnowledgeAndIndexDocuments] WORKFLOW ERROR", {
               id,
               userId,
               websiteUrl,
               target,
               error: error instanceof Error ? error.message : error,
               stack:
                  error instanceof Error && error.stack
                     ? error.stack
                     : undefined,
            });
            propagateError(error);
            throw AppError.internal(
               `Create knowledge and index documents workflow failed: ${(error as Error).message}`,
            );
         }
      },
      { connection: redis, removeOnComplete: { count: 10 } },
   );
registerGracefulShutdown(createKnowledgeAndIndexDocumentsWorker);
