import { Worker, Queue, type Job } from "bullmq";
import type { ContentRequest, PersonaConfig } from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { updateContentStatus } from "../../functions/database/update-content-status";

export interface ContentEditingJobData {
   searchSources: string[];
   agentId: string;
   keywords: string[];
   contentId: string;
   contentRequest: ContentRequest;
   personaConfig: PersonaConfig;
   draft: string;
   userId: string;
}

export interface ContentEditingJobResult {
   contentId: string;
   agentId: string;
   userId: string;
   contentRequest: ContentRequest;
   editedDraft: string;
}

import { enqueueContentGrammarCheckJob } from "./content-grammar-checker-queue";
import { runEditContentDraft } from "../../functions/writing/edit-content-draft";
import { registerGracefulShutdown } from "../../helpers";

export async function runContentEditing(
   payload: ContentEditingJobData,
): Promise<ContentEditingJobResult> {
   const {
      personaConfig,
      agentId,
      contentId,
      keywords,
      contentRequest,
      draft,
      userId,
      searchSources,
   } = payload;
   try {
      // Update status to editing
      await updateContentStatus({
         contentId,
         status: "editing",
      });

      const { content: editedDraft } = await runEditContentDraft({
         data: {
            draft,
         },
         userId,
      });
      console.info("[ContentEditing] Content edited", editedDraft);

      await enqueueContentGrammarCheckJob({
         userId,
         contentId,
         agentId,
         contentRequest,
         personaConfig,
         draft: editedDraft,
         searchSources,
         keywords,
      });
      return { contentId, agentId, userId, contentRequest, editedDraft };
   } catch (error) {
      console.error("[ContentEditing] PIPELINE ERROR", {
         agentId,
         contentId,
         contentRequest,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-editing-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentEditingQueue = new Queue<ContentEditingJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(contentEditingQueue);

export async function enqueueContentEditingJob(
   data: ContentEditingJobData,
   jobOptions?: Parameters<Queue<ContentEditingJobData>["add"]>[2],
) {
   return contentEditingQueue.add(QUEUE_NAME, data, jobOptions);
}

export const contentEditingWorker = new Worker<ContentEditingJobData>(
   QUEUE_NAME,
   async (job: Job<ContentEditingJobData>) => {
      await runContentEditing(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(contentEditingWorker);
