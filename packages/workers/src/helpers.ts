import type { Queue, Worker } from "bullmq";

const shutdownTargets: Array<Queue | Worker> = [];

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
