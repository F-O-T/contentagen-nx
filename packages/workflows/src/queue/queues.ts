import type { ConnectionOptions } from "@packages/queue/bullmq";
import { Queue } from "@packages/queue/bullmq";

// Account Deletion Queue

export const DELETION_QUEUE_NAME = "account-deletion";
export const DELETION_DLQ_NAME = "account-deletion-dlq";

export type DeletionJobType = "process-deletions" | "send-reminders";

export type DeletionJobData = {
   type: DeletionJobType;
};

export type DeletionJobResult = {
   processedCount: number;
   emailsSent: number;
   success: boolean;
   error?: string;
   failedDeletions?: string[];
   failedEmails?: string[];
};

let deletionQueue: Queue<DeletionJobData, DeletionJobResult> | null = null;
let deletionDLQ: Queue<DeletionJobData, DeletionJobResult> | null = null;

export function createDeletionQueue(
   connection: ConnectionOptions,
): Queue<DeletionJobData, DeletionJobResult> {
   if (deletionQueue) {
      return deletionQueue;
   }

   // Create Dead Letter Queue first
   if (!deletionDLQ) {
      deletionDLQ = new Queue<DeletionJobData, DeletionJobResult>(
         DELETION_DLQ_NAME,
         {
            connection,
            defaultJobOptions: {
               removeOnComplete: false,
               removeOnFail: false,
            },
         },
      );
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

export function getDeletionDLQ(): Queue<
   DeletionJobData,
   DeletionJobResult
> | null {
   return deletionDLQ;
}

export async function closeDeletionQueue(): Promise<void> {
   if (deletionQueue) {
      await deletionQueue.close();
      deletionQueue = null;
   }
   if (deletionDLQ) {
      await deletionDLQ.close();
      deletionDLQ = null;
   }
}
