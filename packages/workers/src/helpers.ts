import type { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

export const createRedisClient = (REDIS_URL: string) =>
   new Redis(`${REDIS_URL}?family=6`, {
      maxRetriesPerRequest: null,
   });
const shutdownTargets: Array<Queue | Worker> = [];

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
