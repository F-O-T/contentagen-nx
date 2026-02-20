import { AppError } from "@packages/utils/errors";
import type {
   ProviderStatus,
   SearchOptions,
   SearchProvider,
   SearchResult,
} from "../types";

const SEARXNG_SEARCH_QUEUE = "searxng-search";

class SearXNGProvider implements SearchProvider {
   id = "searxng" as const;
   name = "SearXNG Fleet";

   private key = "searxng-fleet";

   async search(
      query: string,
      options?: SearchOptions,
   ): Promise<SearchResult[]> {
      const { Queue } = await import("bullmq");
      const { env } = await import("@packages/environment/server");

      const queue = new Queue(SEARXNG_SEARCH_QUEUE, {
         connection: { host: new URL(env.REDIS_URL).hostname, port: 6379 },
      });

      try {
         const job = await queue.add(
            "search",
            { query, options: options ?? { maxResults: 10 } },
            { timeout: 15000 },
         );

         const result = await job.waitUntilFinished(
            { host: new URL(env.REDIS_URL).hostname, port: 6379 },
            { timeout: 15000 },
         );

         return result as SearchResult[];
      } catch (error) {
         throw AppError.internal(
            `SearXNG search failed: ${(error as Error).message}`,
         );
      }
   }

   async crawl(_url: string): Promise<never> {
      throw AppError.badRequest(
         "SearXNG does not support crawling. Use Firecrawl provider.",
      );
   }

   async isAvailable(): Promise<boolean> {
      const { createRedisConnection } = await import(
         "@packages/redis/connection"
      );
      const { env } = await import("@packages/environment/server");

      const redis = createRedisConnection(env.REDIS_URL);

      try {
         const count = await redis.scard("searxng:healthy");
         return count > 0;
      } finally {
         await redis.quit();
      }
   }

   getStatus(): ProviderStatus {
      return {
         provider: this.id,
         available: false,
         availableKeys: 0,
         totalKeys: 0,
      };
   }

   markKeyRateLimited(_key: string): void {
      // No keys to manage in fleet model
   }

   getCurrentKey(): string | null {
      return this.key;
   }
}

export const searxngProvider = new SearXNGProvider();
