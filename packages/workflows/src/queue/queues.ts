import type { ConnectionOptions } from "@packages/queue/bullmq";
import { Queue } from "@packages/queue/bullmq";

// Account Deletion Queue

export const DELETION_QUEUE_NAME = "account-deletion";

export type DeletionJobType = "process-deletions" | "send-reminders";

export type DeletionJobData = {
   type: DeletionJobType;
};

export type DeletionJobResult = {
   processedCount: number;
   emailsSent: number;
   success: boolean;
   error?: string;
};

let deletionQueue: Queue<DeletionJobData, DeletionJobResult> | null = null;

export function createDeletionQueue(
   connection: ConnectionOptions,
): Queue<DeletionJobData, DeletionJobResult> {
   if (deletionQueue) {
      return deletionQueue;
   }

   deletionQueue = new Queue<DeletionJobData, DeletionJobResult>(
      DELETION_QUEUE_NAME,
      {
         connection,
         defaultJobOptions: {
            attempts: 3,
            backoff: {
               delay: 5000,
               type: "exponential",
            },
            removeOnComplete: {
               age: 7 * 24 * 60 * 60,
               count: 100,
            },
            removeOnFail: {
               age: 14 * 24 * 60 * 60,
            },
         },
      },
   );

   return deletionQueue;
}

export function getDeletionQueue(): Queue<
   DeletionJobData,
   DeletionJobResult
> | null {
   return deletionQueue;
}

export async function closeDeletionQueue(): Promise<void> {
   if (deletionQueue) {
      await deletionQueue.close();
      deletionQueue = null;
   }
}
