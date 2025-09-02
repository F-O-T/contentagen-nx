import type { Queue, Worker, Job } from "bullmq";

const shutdownTargets: Array<Queue | Worker> = [];

// Job monitoring configuration
const STUCK_JOB_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const MONITORING_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface JobMonitorOptions {
   queue: Queue;
   worker: Worker;
   jobTimeout?: number;
   monitoringInterval?: number;
}

/**
 * Register a queue/worker for graceful shutdown.
 * @param instance BullMQ Queue, Worker, or QueueScheduler
 */
export function registerGracefulShutdown(instance: Queue | Worker) {
   shutdownTargets.push(instance);
}

let shutdownInitiated = false;
async function gracefulShutdown(signal: string) {
   if (shutdownInitiated) return;
   shutdownInitiated = true;
   console.log(`Received ${signal}, shutting down queues/workers...`);
   for (const target of shutdownTargets) {
      if (typeof target.close === "function") {
         try {
            await target.close();
            console.log(`Closed ${target.constructor.name}`);
         } catch (err) {
            console.error(`Failed to close ${target.constructor.name}:`, err);
         }
      }
   }
   process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

/**
 * Monitor for stuck jobs and clean them up
 */
export async function startJobMonitoring(options: JobMonitorOptions) {
   const {
      queue,
      worker, // Reserved for future use (e.g., worker-specific monitoring)
      jobTimeout = STUCK_JOB_TIMEOUT,
      monitoringInterval = MONITORING_INTERVAL,
   } = options;

   console.log(
      `[JobMonitor] Starting job monitoring for ${queue.name} (${worker?.name || "worker"}) with ${monitoringInterval}ms interval`,
   );

   const monitorInterval = setInterval(async () => {
      try {
         // Get active jobs
         const activeJobs = await queue.getActive();
         const now = Date.now();

         for (const job of activeJobs) {
            const jobAge = now - (job.processedOn || job.timestamp);
            if (jobAge > jobTimeout) {
               console.warn(
                  `[JobMonitor] Found stuck job ${job.id} in queue ${queue.name}, age: ${Math.round(jobAge / 1000)}s`,
               );

               // Move stuck job to failed
               await job.moveToFailed(
                  new Error(`Job timed out after ${jobTimeout}ms`),
                  true,
               );
               console.log(
                  `[JobMonitor] Moved stuck job ${job.id} to failed state`,
               );
            }
         }

         // Check for jobs that have been in waiting too long (potential Redis issues)
         const waitingJobs = await queue.getWaiting();
         for (const job of waitingJobs) {
            const jobAge = now - job.timestamp;
            if (jobAge > jobTimeout * 2) {
               // Double timeout for waiting jobs
               console.warn(
                  `[JobMonitor] Found old waiting job ${job.id} in queue ${queue.name}, age: ${Math.round(jobAge / 1000)}s`,
               );

               // Remove old waiting jobs
               await job.remove();
               console.log(`[JobMonitor] Removed old waiting job ${job.id}`);
            }
         }
      } catch (error) {
         console.error(
            `[JobMonitor] Error during job monitoring for ${queue.name}:`,
            error,
         );
      }
   }, monitoringInterval);

   // Store interval for cleanup
   const monitoringIntervals = (global as any).jobMonitoringIntervals || [];
   monitoringIntervals.push(monitorInterval);
   (global as any).jobMonitoringIntervals = monitoringIntervals;

   return monitorInterval;
}

/**
 * Clean up job monitoring intervals
 */
export function stopJobMonitoring() {
   const monitoringIntervals = (global as any).jobMonitoringIntervals || [];
   for (const interval of monitoringIntervals) {
      clearInterval(interval);
   }
   (global as any).jobMonitoringIntervals = [];
}

/**
 * Enhanced job processor wrapper with timeout and error handling
 */
export function createJobProcessor<T>(
   processor: (job: Job<T>) => Promise<void>,
   options: {
      timeout?: number;
      retries?: number;
   } = {},
) {
   const { timeout = 5 * 60 * 1000, retries = 2 } = options; // 5 min timeout, 2 retries

   return async (job: Job<T>) => {
      const startTime = Date.now();

      try {
         console.log(
            `[JobProcessor] Starting job ${job.id} in queue ${job.queueName}`,
         );

         // Create timeout promise
         const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
               reject(new Error(`Job ${job.id} timed out after ${timeout}ms`));
            }, timeout);
         });

         // Race between job processing and timeout
         await Promise.race([processor(job), timeoutPromise]);

         const duration = Date.now() - startTime;
         console.log(`[JobProcessor] Completed job ${job.id} in ${duration}ms`);
      } catch (error) {
         const duration = Date.now() - startTime;
         console.error(
            `[JobProcessor] Job ${job.id} failed after ${duration}ms:`,
            {
               error: error instanceof Error ? error.message : error,
               queue: job.queueName,
               attemptsMade: job.attemptsMade,
               attemptsRemaining: retries - job.attemptsMade,
            },
         );

         // Re-throw to let BullMQ handle retries
         throw error;
      }
   };
}
