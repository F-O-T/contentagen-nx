/**
 * Registers graceful shutdown for BullMQ queues/workers.
 * Usage: call registerGracefulShutdown(queueOrWorker) for each instance.
 * On SIGINT/SIGTERM, all registered instances will be closed before exit.
 */
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

// Example usage comment:
// import { Queue, Worker } from "bullmq";
// import { registerGracefulShutdown } from "./helpers";
// const queue = new Queue("myQueue", ...);
// registerGracefulShutdown(queue);
// const worker = new Worker("myQueue", async job => { ... });
// registerGracefulShutdown(worker);
