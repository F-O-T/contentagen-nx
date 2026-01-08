import { createDb } from "@packages/database/client";
import { workerEnv as env } from "@packages/environment/worker";
import { getWorkerLogger, sendHeartbeat } from "@packages/logging/worker";
import type { Job } from "@packages/queue/bullmq";
import {
   closeRedisConnection,
   createRedisConnection,
} from "@packages/queue/connection";
import { getResendClient } from "@packages/transactional/utils";
import { createDeletionWorker } from "@packages/workflows/queue/deletion-consumer";
import {
   closeDeletionQueue,
   createDeletionQueue,
   type DeletionJobData,
   type DeletionJobResult,
} from "@packages/workflows/queue/queues";

const logger = getWorkerLogger(env);

const MEMORY_THRESHOLD_MB = 512;
const HEALTH_CHECK_INTERVAL_MS = 180000; // 3 minutes

const db = createDb({ databaseUrl: env.DATABASE_URL });

const redisConnection = createRedisConnection(env.REDIS_URL);

const resendClient = env.RESEND_API_KEY
   ? getResendClient(env.RESEND_API_KEY)
   : undefined;

logger.info("Starting deletion worker");

let isShuttingDown = false;

// Deletion queue and worker
const deletionQueue = createDeletionQueue(redisConnection);

// Schedule deletion processing jobs
await deletionQueue.add(
   "process-deletions",
   { type: "process-deletions" },
   {
      jobId: "process-deletions-daily",
      repeat: { pattern: "0 2 * * *" }, // 2 AM daily
   },
);

await deletionQueue.add(
   "send-reminders",
   { type: "send-reminders" },
   {
      jobId: "send-reminders-daily",
      repeat: { pattern: "0 9 * * *" }, // 9 AM daily
   },
);

logger.info(
   { processTime: "2 AM", reminderTime: "9 AM" },
   "Scheduled daily account deletion jobs",
);

const { worker: deletionWorker, close: closeDeletionWorker } =
   createDeletionWorker({
      concurrency: 1,
      connection: redisConnection,
      db,
      resendClient,
      appUrl: env.APP_URL,
      onCompleted: async (
         job: Job<DeletionJobData, DeletionJobResult>,
         result: DeletionJobResult,
      ) => {
         logger.info(
            {
               jobName: job.name,
               processedCount: result.processedCount,
               emailsSent: result.emailsSent,
            },
            "Deletion job completed",
         );
      },
      onFailed: async (
         job: Job<DeletionJobData, DeletionJobResult> | undefined,
         error: Error,
      ) => {
         logger.error(
            { jobName: job?.name, err: error },
            "Deletion job failed",
         );
      },
   });

logger.info("Deletion worker started");

async function gracefulShutdown(signal: string) {
   if (isShuttingDown) {
      logger.info("Shutdown already in progress");
      return;
   }

   isShuttingDown = true;
   logger.info(
      { signal },
      "Received shutdown signal, shutting down gracefully",
   );

   const shutdownTimeout = setTimeout(() => {
      logger.error("Shutdown timeout exceeded, forcing exit");
      process.exit(1);
   }, 30000);

   try {
      logger.info("Pausing worker to stop accepting new jobs");
      await deletionWorker.pause();

      logger.info("Waiting for active jobs to complete");
      await closeDeletionWorker();

      logger.info("Closing queues");
      await closeDeletionQueue();

      logger.info("Closing Redis connection");
      await closeRedisConnection();

      clearTimeout(shutdownTimeout);
      logger.info("Worker shut down complete");
      process.exit(0);
   } catch (error) {
      clearTimeout(shutdownTimeout);
      logger.error({ err: error }, "Error during shutdown");
      process.exit(1);
   }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
   logger.error({ err: error }, "Uncaught exception");
   gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
   logger.error({ reason, promise }, "Unhandled rejection");
});

const healthCheckInterval = setInterval(async () => {
   if (isShuttingDown) {
      clearInterval(healthCheckInterval);
      return;
   }

   const memUsage = process.memoryUsage();
   const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
   const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
   const rssMB = Math.round(memUsage.rss / 1024 / 1024);

   logger.info({ heapUsedMB, heapTotalMB, rssMB }, "Health check");

   // Send heartbeat to Better Stack
   await sendHeartbeat(env.BETTER_STACK_HEARTBEAT_URL);

   if (heapUsedMB > MEMORY_THRESHOLD_MB) {
      logger.warn(
         { heapUsedMB, threshold: MEMORY_THRESHOLD_MB },
         "Memory warning: heap usage exceeds threshold",
      );

      if (global.gc) {
         logger.info("Triggering garbage collection");
         global.gc();
      }

      const afterGC = process.memoryUsage();
      const afterHeapMB = Math.round(afterGC.heapUsed / 1024 / 1024);

      if (afterHeapMB > MEMORY_THRESHOLD_MB * 1.5) {
         logger.error(
            { afterHeapMB, criticalThreshold: MEMORY_THRESHOLD_MB * 1.5 },
            "Memory critical: initiating graceful restart",
         );
         gracefulShutdown("MEMORY_PRESSURE");
      }
   }
}, HEALTH_CHECK_INTERVAL_MS);
