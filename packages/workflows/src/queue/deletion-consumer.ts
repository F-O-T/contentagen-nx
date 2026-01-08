import type { DatabaseInstance } from "@packages/database/client";
import { deleteAllUserData } from "@packages/database/repositories/user-deletion-repository";
import { accountDeletionRequest, user } from "@packages/database/schema";
import type { ConnectionOptions, WorkerOptions } from "@packages/queue/bullmq";
import { type Job, Worker } from "@packages/queue/bullmq";
import {
   sendDeletionCompletedEmail,
   sendDeletionReminderEmail,
} from "@packages/transactional/client";
import { arrayContains, eq, not, sql } from "drizzle-orm";
import type { Resend } from "resend";

const REMINDER_7_DAY = "7_day";
const REMINDER_1_DAY = "1_day";
import {
   DELETION_QUEUE_NAME,
   type DeletionJobData,
   type DeletionJobResult,
} from "./queues";

export type DeletionWorkerConfig = {
   connection: ConnectionOptions;
   db: DatabaseInstance;
   resendClient?: Resend;
   appUrl: string;
   concurrency?: number;
   onCompleted?: (
      job: Job<DeletionJobData, DeletionJobResult>,
      result: DeletionJobResult,
   ) => void | Promise<void>;
   onFailed?: (
      job: Job<DeletionJobData, DeletionJobResult> | undefined,
      error: Error,
   ) => void | Promise<void>;
   onError?: (error: Error) => void | Promise<void>;
};

export type DeletionWorker = {
   worker: Worker<DeletionJobData, DeletionJobResult>;
   close: () => Promise<void>;
};

type DeletionProcessResult = {
   processedCount: number;
   emailsSent: number;
   failedDeletions: string[];
   failedEmails: string[];
};

/**
 * Process users scheduled for deletion
 */
async function processScheduledDeletions(
   db: DatabaseInstance,
   resendClient?: Resend,
): Promise<DeletionProcessResult> {
   const now = new Date();
   let processedCount = 0;
   let emailsSent = 0;
   const failedDeletions: string[] = [];
   const failedEmails: string[] = [];

   // Find all pending requests where scheduledDeletionAt <= now
   const pendingDeletions = await db.query.accountDeletionRequest.findMany({
      where: (req, { and: andOp, eq: eqOp, lte: lteOp, isNotNull: isNotNullOp }) =>
         andOp(
            eqOp(req.status, "pending"),
            eqOp(req.type, "grace_period"),
            isNotNullOp(req.scheduledDeletionAt),
            lteOp(req.scheduledDeletionAt, now),
         ),
   });

   for (const deletion of pendingDeletions) {
      try {
         // Get user info before deletion
         const userRecord = await db.query.user.findFirst({
            where: (u, { eq: eqOp }) => eqOp(u.id, deletion.userId),
         });

         if (!userRecord) {
            // User already deleted, just mark the request as completed
            await db
               .update(accountDeletionRequest)
               .set({ status: "completed", completedAt: new Date() })
               .where(eq(accountDeletionRequest.id, deletion.id));
            continue;
         }

         // Delete all user data (across all organizations)
         await deleteAllUserData(db, deletion.userId);

         // Delete the user record (cascades to auth data via onDelete: "cascade")
         await db.delete(user).where(eq(user.id, deletion.userId));

         // Mark deletion as completed
         await db
            .update(accountDeletionRequest)
            .set({ status: "completed", completedAt: new Date() })
            .where(eq(accountDeletionRequest.id, deletion.id));

         // Send completion email
         if (resendClient && userRecord.email) {
            try {
               await sendDeletionCompletedEmail(resendClient, {
                  email: userRecord.email,
                  userName: userRecord.name || "Usuário",
               });
               emailsSent++;
            } catch (emailError) {
               console.error("Failed to send deletion completed email:", emailError);
               failedEmails.push(userRecord.email);
            }
         }

         processedCount++;
      } catch (error) {
         console.error(`Failed to process deletion for user ${deletion.userId}:`, error);
         failedDeletions.push(deletion.userId);
      }
   }

   return { processedCount, emailsSent, failedDeletions, failedEmails };
}

/**
 * Send reminder emails to users scheduled for deletion
 */
async function sendDeletionReminders(
   db: DatabaseInstance,
   resendClient: Resend | undefined,
   appUrl: string,
): Promise<{ processedCount: number; emailsSent: number }> {
   if (!resendClient) {
      return { processedCount: 0, emailsSent: 0 };
   }

   const now = new Date();
   let emailsSent = 0;

   // Calculate dates for 7 days and 1 day reminders
   const sevenDaysFromNow = new Date(now);
   sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
   const sevenDaysStart = new Date(sevenDaysFromNow);
   sevenDaysStart.setHours(0, 0, 0, 0);
   const sevenDaysEnd = new Date(sevenDaysFromNow);
   sevenDaysEnd.setHours(23, 59, 59, 999);

   const oneDayFromNow = new Date(now);
   oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
   const oneDayStart = new Date(oneDayFromNow);
   oneDayStart.setHours(0, 0, 0, 0);
   const oneDayEnd = new Date(oneDayFromNow);
   oneDayEnd.setHours(23, 59, 59, 999);

   // Find users scheduled for deletion in 7 days (excluding already reminded)
   const sevenDayReminders = await db.query.accountDeletionRequest.findMany({
      where: (req, { and: andOp, eq: eqOp, gte: gteOp, lte: lteOp }) =>
         andOp(
            eqOp(req.status, "pending"),
            eqOp(req.type, "grace_period"),
            gteOp(req.scheduledDeletionAt!, sevenDaysStart),
            lteOp(req.scheduledDeletionAt!, sevenDaysEnd),
            not(arrayContains(req.remindersSent, [REMINDER_7_DAY])),
         ),
   });

   // Find users scheduled for deletion in 1 day (excluding already reminded)
   const oneDayReminders = await db.query.accountDeletionRequest.findMany({
      where: (req, { and: andOp, eq: eqOp, gte: gteOp, lte: lteOp }) =>
         andOp(
            eqOp(req.status, "pending"),
            eqOp(req.type, "grace_period"),
            gteOp(req.scheduledDeletionAt!, oneDayStart),
            lteOp(req.scheduledDeletionAt!, oneDayEnd),
            not(arrayContains(req.remindersSent, [REMINDER_1_DAY])),
         ),
   });

   const cancelUrl = `${appUrl}/settings/profile`;

   // Send 7-day reminders
   for (const deletion of sevenDayReminders) {
      const userRecord = await db.query.user.findFirst({
         where: (u, { eq: eqOp }) => eqOp(u.id, deletion.userId),
      });

      if (userRecord?.email) {
         try {
            await sendDeletionReminderEmail(resendClient, {
               email: userRecord.email,
               userName: userRecord.name || "Usuário",
               daysRemaining: 7,
               cancelUrl,
            });

            // Track that 7-day reminder was sent
            await db
               .update(accountDeletionRequest)
               .set({
                  remindersSent: sql`array_append(${accountDeletionRequest.remindersSent}, ${REMINDER_7_DAY})`,
               })
               .where(eq(accountDeletionRequest.id, deletion.id));

            emailsSent++;
         } catch (error) {
            console.error("Failed to send 7-day reminder:", error);
         }
      }
   }

   // Send 1-day reminders
   for (const deletion of oneDayReminders) {
      const userRecord = await db.query.user.findFirst({
         where: (u, { eq: eqOp }) => eqOp(u.id, deletion.userId),
      });

      if (userRecord?.email) {
         try {
            await sendDeletionReminderEmail(resendClient, {
               email: userRecord.email,
               userName: userRecord.name || "Usuário",
               daysRemaining: 1,
               cancelUrl,
            });

            // Track that 1-day reminder was sent
            await db
               .update(accountDeletionRequest)
               .set({
                  remindersSent: sql`array_append(${accountDeletionRequest.remindersSent}, ${REMINDER_1_DAY})`,
               })
               .where(eq(accountDeletionRequest.id, deletion.id));

            emailsSent++;
         } catch (error) {
            console.error("Failed to send 1-day reminder:", error);
         }
      }
   }

   return {
      processedCount: sevenDayReminders.length + oneDayReminders.length,
      emailsSent,
   };
}

export function createDeletionWorker(
   config: DeletionWorkerConfig,
): DeletionWorker {
   const {
      connection,
      db,
      resendClient,
      appUrl,
      concurrency = 1,
      onCompleted,
      onFailed,
      onError,
   } = config;

   const workerOptions: WorkerOptions = {
      concurrency,
      connection,
   };

   const worker = new Worker<DeletionJobData, DeletionJobResult>(
      DELETION_QUEUE_NAME,
      async (job: Job<DeletionJobData, DeletionJobResult>) => {
         const { type } = job.data;

         if (type === "process-deletions") {
            const result = await processScheduledDeletions(db, resendClient);

            // If all deletions failed, throw to trigger retry
            if (result.failedDeletions.length > 0 && result.processedCount === 0) {
               throw new Error(
                  `All deletions failed: ${result.failedDeletions.join(", ")}`,
               );
            }

            return {
               processedCount: result.processedCount,
               emailsSent: result.emailsSent,
               failedDeletions: result.failedDeletions,
               failedEmails: result.failedEmails,
               success: result.failedDeletions.length === 0,
               error:
                  result.failedDeletions.length > 0
                     ? `${result.failedDeletions.length} deletions failed`
                     : undefined,
            };
         }

         if (type === "send-reminders") {
            const result = await sendDeletionReminders(db, resendClient, appUrl);
            return {
               processedCount: result.processedCount,
               emailsSent: result.emailsSent,
               success: true,
            };
         }

         throw new Error(`Unknown deletion job type: ${type}`);
      },
      workerOptions,
   );

   if (onCompleted) {
      worker.on("completed", onCompleted);
   }

   if (onFailed) {
      worker.on("failed", onFailed);
   }

   // Handle worker-level errors (Redis connection issues, etc.)
   if (onError) {
      worker.on("error", onError);
   } else {
      worker.on("error", (error) => {
         console.error("[DeletionWorker] Worker error:", error);
      });
   }

   return {
      close: async () => {
         await worker.close();
      },
      worker,
   };
}
