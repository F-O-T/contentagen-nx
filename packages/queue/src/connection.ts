import type { ConnectionOptions } from "bullmq";

/**
 * Create BullMQ-compatible connection options from a Redis URL.
 *
 * BullMQ manages its own connections internally — it needs connection
 * config, not a pre-existing ioredis instance.
 */
export function createQueueConnection(redisUrl: string): ConnectionOptions {
   const url = new URL(redisUrl);

   return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      family: 6,
      maxRetriesPerRequest: null,
   };
}
